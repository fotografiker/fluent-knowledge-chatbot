
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Convert to text (improved PDF text extraction)
    const text = await extractTextFromPDF(fileData);
    
    // Chunk the text with improved chunking
    const chunks = chunkText(text, 800, 150); // Smaller chunks with less overlap
    
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

// Improved PDF text extraction with better structure preservation
async function extractTextFromPDF(file: Blob): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfData = new Uint8Array(arrayBuffer);
    
    // Convert to string for parsing
    const pdfString = new TextDecoder('latin1').decode(pdfData);
    
    // Extract text with better structure preservation
    let extractedText = '';
    const lines: string[] = [];
    
    // Look for text objects in PDF structure
    const textObjects = pdfString.match(/BT\s+.*?ET/gs) || [];
    
    for (const textObj of textObjects) {
      // Extract positioning and text commands
      const commands = textObj.split(/\s+/);
      let currentLine = '';
      
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        
        // Look for text in parentheses (standard text)
        if (command.includes('(') && command.includes(')')) {
          const textMatch = command.match(/\(([^)]*)\)/);
          if (textMatch) {
            let text = textMatch[1]
              .replace(/\\n/g, ' ')
              .replace(/\\r/g, ' ')
              .replace(/\\t/g, ' ')
              .replace(/\\([()\\])/g, '$1')
              .replace(/\\\d{3}/g, '')
              .trim();
            
            if (text && text.length > 0 && /[a-zA-Z]/.test(text)) {
              currentLine += text + ' ';
            }
          }
        }
        
        // Look for text in angle brackets (hex-encoded)
        if (command.includes('<') && command.includes('>')) {
          const hexMatch = command.match(/<([^>]*)>/);
          if (hexMatch) {
            try {
              const hex = hexMatch[1];
              const text = hex.match(/.{1,2}/g)?.map(byte => String.fromCharCode(parseInt(byte, 16))).join('') || '';
              if (text && text.length > 0 && /[a-zA-Z]/.test(text)) {
                currentLine += text + ' ';
              }
            } catch {
              // Skip invalid hex
            }
          }
        }
        
        // Check for line positioning commands that might indicate new lines
        if (command === 'Td' || command === 'TD' || command === 'T*') {
          if (currentLine.trim()) {
            lines.push(currentLine.trim());
            currentLine = '';
          }
        }
      }
      
      // Add any remaining text
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
    }
    
    // If no structured text found, try alternative extraction
    if (lines.length === 0) {
      // Look for Tj and TJ operators with better line detection
      const tjMatches = pdfString.match(/\(([^)]+)\)\s*Tj/g) || [];
      const tjArrayMatches = pdfString.match(/\[([^\]]*)\]\s*TJ/g) || [];
      
      for (const match of tjMatches) {
        const textMatch = match.match(/\(([^)]+)\)/);
        if (textMatch) {
          const text = textMatch[1].replace(/\\n/g, ' ').replace(/\\r/g, ' ').trim();
          if (text && /[a-zA-Z]/.test(text)) {
            lines.push(text);
          }
        }
      }
      
      for (const match of tjArrayMatches) {
        const arrayContent = match.match(/\[([^\]]*)\]/)?.[1] || '';
        const textParts = arrayContent.match(/\(([^)]*)\)/g) || [];
        let arrayLine = '';
        
        for (const part of textParts) {
          const text = part.slice(1, -1).replace(/\\n/g, ' ').replace(/\\r/g, ' ').trim();
          if (text && /[a-zA-Z]/.test(text)) {
            arrayLine += text + ' ';
          }
        }
        
        if (arrayLine.trim()) {
          lines.push(arrayLine.trim());
        }
      }
    }
    
    // Join lines with proper spacing and paragraph detection
    extractedText = lines.join('\n');
    
    // Clean up the final text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/\n\s+/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return extractedText || 'PDF processed but no readable text could be extracted. This may be a scanned document, image-based PDF, or the text may be encoded in a format not supported by this parser.';
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    return `PDF uploaded successfully but text extraction failed: ${error.message}. You may need to use OCR for scanned documents.`;
  }
}

// Enhanced text chunking function with better sentence and paragraph awareness
function chunkText(text: string, chunkSize: number = 800, overlap: number = 150): string[] {
  const chunks: string[] = [];
  
  if (text.length <= chunkSize) {
    return [text];
  }
  
  // Split text into paragraphs first
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    
    // If adding this paragraph would exceed chunk size
    if (currentChunk.length + trimmedParagraph.length > chunkSize) {
      // If we have content, save the current chunk
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        
        // Start new chunk with overlap from previous chunk
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 6)); // Approximate word overlap
        currentChunk = overlapWords.join(' ') + ' ';
      }
      
      // If paragraph itself is too long, split it by sentences
      if (trimmedParagraph.length > chunkSize) {
        const sentences = trimmedParagraph.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        for (const sentence of sentences) {
          const trimmedSentence = sentence.trim() + '.';
          
          if (currentChunk.length + trimmedSentence.length > chunkSize) {
            if (currentChunk.trim()) {
              chunks.push(currentChunk.trim());
              currentChunk = '';
            }
            
            // If single sentence is still too long, split by words
            if (trimmedSentence.length > chunkSize) {
              const words = trimmedSentence.split(' ');
              let wordChunk = '';
              
              for (const word of words) {
                if (wordChunk.length + word.length + 1 > chunkSize) {
                  if (wordChunk.trim()) {
                    chunks.push(wordChunk.trim());
                  }
                  wordChunk = word + ' ';
                } else {
                  wordChunk += word + ' ';
                }
              }
              
              if (wordChunk.trim()) {
                currentChunk = wordChunk;
              }
            } else {
              currentChunk = trimmedSentence + ' ';
            }
          } else {
            currentChunk += trimmedSentence + ' ';
          }
        }
      } else {
        currentChunk += trimmedParagraph + '\n\n';
      }
    } else {
      currentChunk += trimmedParagraph + '\n\n';
    }
  }
  
  // Add the final chunk if it has content
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  // Filter out very small chunks
  return chunks.filter(chunk => chunk.length > 50);
}
