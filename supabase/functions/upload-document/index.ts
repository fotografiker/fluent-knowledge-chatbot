import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getDocument, GlobalWorkerOptions } from "https://esm.sh/pdfjs-dist@4.0.379/build/pdf.min.mjs";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return new Response(
        JSON.stringify({ error: 'Only PDF files are supported' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File size must be less than 10MB' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert document record
    const { data: document, error: dbError } = await supabaseClient
      .from('documents')
      .insert({
        title: title || file.name,
        filename: file.name,
        storage_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        user_id: user.id,
        processing_status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file
      await supabaseClient.storage.from('documents').remove([filePath]);
      return new Response(
        JSON.stringify({ error: 'Failed to save document record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start document processing in the background
    EdgeRuntime.waitUntil(processDocument(supabaseClient, document.id, filePath));

    return new Response(
      JSON.stringify({ 
        success: true, 
        document: {
          id: document.id,
          title: document.title,
          filename: document.filename,
          status: document.processing_status
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in upload-document function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processDocument(supabaseClient: any, documentId: string, filePath: string) {
  try {
    // Update status to processing
    await supabaseClient
      .from('documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    // Download the file for processing
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('documents')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert to text (basic PDF text extraction)
    const text = await extractTextFromPDF(fileData);
    
    // Chunk the text
    const chunks = chunkText(text, 1000, 200); // 1000 chars with 200 char overlap
    
    // Insert chunks
    const chunkPromises = chunks.map((chunk, index) => 
      supabaseClient
        .from('document_chunks')
        .insert({
          document_id: documentId,
          content: chunk,
          chunk_index: index,
          metadata: { chunk_size: chunk.length }
        })
    );

    await Promise.all(chunkPromises);

    // Update document status
    await supabaseClient
      .from('documents')
      .update({ 
        processing_status: 'completed',
        chunk_count: chunks.length 
      })
      .eq('id', documentId);

    console.log(`Document ${documentId} processed successfully with ${chunks.length} chunks`);

  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);
    
    // Update status to failed
    await supabaseClient
      .from('documents')
      .update({ 
        processing_status: 'failed',
        processing_error: error.message 
      })
      .eq('id', documentId);
  }
}

// Proper PDF text extraction using PDF.js
async function extractTextFromPDF(file: Blob): Promise<string> {
  try {
    // Disable worker to avoid issues in Deno environment
    GlobalWorkerOptions.workerSrc = '';
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Load the PDF document
    const loadingTask = getDocument({ data: uint8Array, verbosity: 0 });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Combine text items from the page
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (pageText) {
        fullText += pageText + '\n\n';
      }
    }
    
    return fullText.trim() || 'No text content found in PDF';
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    return `Failed to extract text from PDF: ${error.message}`;
  }
}

// Text chunking function
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + chunkSize;
    
    // Try to end at a sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const boundary = Math.max(lastPeriod, lastNewline);
      
      if (boundary > start + chunkSize * 0.5) {
        end = boundary + 1;
      }
    }
    
    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}