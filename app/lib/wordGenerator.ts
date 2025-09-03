// Word Document Generation functionality - only loaded when needed
export async function generateWordDocument(textContent: string): Promise<Buffer> {
  try {
    const docx = await import('docx');
    
    // Convert plain text to docx paragraphs
    const paragraphs = textContent.split('\n').map(line => 
      new docx.Paragraph({ text: line.trim() })
    );
    
    const doc = new docx.Document({
      sections: [{
        properties: {},
        children: paragraphs
      }]
    });
    
    return await docx.Packer.toBuffer(doc);
  } catch (error) {
    console.error('Word generation error:', error);
    throw new Error(`Word generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}