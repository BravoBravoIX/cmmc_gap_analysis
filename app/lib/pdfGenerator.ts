// PDF Generation functionality - only loaded when needed
export async function generatePDF(html: string): Promise<Buffer> {
  try {
    const puppeteer = await import('puppeteer');
    
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin-top: 10px;">
          CMMC Assessment Report
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin-bottom: 10px;">
          <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `
    });
    
    await page.close();
    await browser.close();
    
    return Buffer.from(pdf);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}