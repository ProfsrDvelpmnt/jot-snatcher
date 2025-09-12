// PDF Export utility for job data
import { JobData } from '@/types';

// Declare global types for the libraries
declare global {
  interface Window {
    jsPDF: any;
    jspdf: any;
    html2canvas: any;
  }
}

export class PDFExporter {
  // Preload libraries to make them available globally
  public static async preloadLibraries(): Promise<void> {
    console.log('🔄 Preloading PDF libraries...');
    await this.loadLibraries();
    console.log('✅ PDF libraries preloaded and available globally');
  }

  private static async loadLibraries(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if libraries are already loaded
      if ((window.jsPDF || (window.jspdf && window.jspdf.jsPDF)) && window.html2canvas) {
        console.log('✅ PDF libraries already loaded');
        resolve();
        return;
      }

      console.log('📚 Loading PDF libraries...');
      let loadedCount = 0;
      const totalLibraries = 2;
      let hasError = false;

      const checkComplete = () => {
        loadedCount++;
        console.log(`📚 Library loaded: ${loadedCount}/${totalLibraries}`);
        if (loadedCount === totalLibraries && !hasError) {
          console.log('✅ All PDF libraries loaded successfully');
          resolve();
        }
      };

      const handleError = (libraryName: string, error: any) => {
        console.error(`❌ Failed to load ${libraryName}:`, error);
        hasError = true;
        reject(new Error(`Failed to load ${libraryName}: ${error.message || error}`));
      };

      // Load jsPDF
      if (!window.jsPDF && !(window.jspdf && window.jspdf.jsPDF)) {
        console.log('📚 Loading jsPDF...');
        const jsPDFScript = document.createElement('script');
        jsPDFScript.src = chrome.runtime.getURL('jspdf.umd.min.js');
        jsPDFScript.onload = () => {
          console.log('✅ jsPDF loaded');
          // Make sure jsPDF is available on window (check both jsPDF and jspdf.jsPDF)
          if (window.jsPDF || (window.jspdf && window.jspdf.jsPDF)) {
            checkComplete();
          } else {
            handleError('jsPDF', new Error('jsPDF not available after loading'));
          }
        };
        jsPDFScript.onerror = (error) => handleError('jsPDF', error);
        document.head.appendChild(jsPDFScript);
      } else {
        console.log('✅ jsPDF already available');
        checkComplete();
      }

      // Load html2canvas
      if (!window.html2canvas) {
        console.log('📚 Loading html2canvas...');
        const html2canvasScript = document.createElement('script');
        html2canvasScript.src = chrome.runtime.getURL('html2canvas.min.js');
        html2canvasScript.onload = () => {
          console.log('✅ html2canvas loaded');
          // Make sure html2canvas is available on window
          if (window.html2canvas) {
            checkComplete();
          } else {
            handleError('html2canvas', new Error('html2canvas not available after loading'));
          }
        };
        html2canvasScript.onerror = (error) => handleError('html2canvas', error);
        document.head.appendChild(html2canvasScript);
      } else {
        console.log('✅ html2canvas already available');
        checkComplete();
      }
    });
  }

  public static async exportJobDataAsPDF(jobData: JobData): Promise<void> {
    try {
      console.log('🚀 Starting PDF export for job:', jobData.position);
      
      await this.loadLibraries();
      console.log('✅ Libraries loaded, proceeding with PDF generation');

      // Create PDF with proper margins
      console.log('📄 Creating PDF...');
      const jsPDF = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
      if (!jsPDF) {
        throw new Error('jsPDF library not available');
      }
      
      let pdf;
      try {
        pdf = new jsPDF('p', 'mm', 'a4');
        console.log('✅ PDF created successfully');
      } catch (error) {
        console.error('❌ Error creating PDF:', error);
        throw new Error(`Failed to create PDF: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Calculate dimensions with proper margins (0.5 inches = 12.7mm)
      const marginInches = 0.5;
      const marginMM = marginInches * 25.4; // Convert inches to mm
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pdfWidth - (marginMM * 2); // Left and right margins
      const contentHeight = pdfHeight - (marginMM * 2); // Top and bottom margins

      console.log('📄 PDF dimensions:', { 
        pdfWidth, 
        pdfHeight, 
        marginMM, 
        contentWidth, 
        contentHeight
      });

      // Generate content directly in PDF using text instead of HTML-to-canvas
      this.addJobDataToPDF(pdf, jobData, marginMM, contentWidth, contentHeight);

      // Download the PDF with company name and date format
      try {
        const fileName = this.generateFileName(jobData);
        console.log('💾 Saving PDF as:', fileName);
        pdf.save(fileName);
        console.log('✅ PDF export completed successfully');
      } catch (error) {
        console.error('❌ Error saving PDF:', error);
        throw new Error(`Failed to save PDF: ${error instanceof Error ? error.message : String(error)}`);
      }

    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw new Error('Failed to generate PDF: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  private static addJobDataToPDF(pdf: any, jobData: JobData, marginMM: number, contentWidth: number, contentHeight: number): void {
    let currentY = marginMM;
    const lineHeight = 6; // mm
    const fontSize = 12;
    const titleFontSize = 18;
    const headerFontSize = 14;
    const sectionFontSize = 13;

    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize: number, isBold: boolean = false, x: number = marginMM) => {
      pdf.setFontSize(fontSize);
      if (isBold) {
        pdf.setFont(undefined, 'bold');
      } else {
        pdf.setFont(undefined, 'normal');
      }

      // Split text into lines that fit within content width
      const lines = pdf.splitTextToSize(text, contentWidth);
      
      for (const line of lines) {
        // Check if we need a new page
        if (currentY + lineHeight > marginMM + contentHeight) {
          pdf.addPage();
          currentY = marginMM;
          this.addFooter(pdf, marginMM, contentWidth, contentHeight);
        }
        
        pdf.text(line, x, currentY);
        currentY += lineHeight;
      }
    };

    // Helper function to add a section header with lines above and below
    const addSectionHeader = (text: string) => {
      currentY += lineHeight; // Add some space before section
      
      // Add line above section title
      pdf.setLineWidth(0.2);
      pdf.setDrawColor(128, 128, 128);
      pdf.line(marginMM, currentY, marginMM + contentWidth, currentY);
      currentY += lineHeight;
      
      // Add section title
      addText(text, headerFontSize, true);
      
      // Add line below section title
      pdf.setLineWidth(0.2);
      pdf.setDrawColor(128, 128, 128);
      pdf.line(marginMM, currentY, marginMM + contentWidth, currentY);
      currentY += lineHeight; // Add space after header
    };

    // Helper function to add a key-value pair
    const addKeyValue = (key: string, value: string, x: number = marginMM) => {
      const keyWidth = 60; // mm
      const valueX = x + keyWidth;
      const valueWidth = contentWidth - keyWidth;
      
      // Add key
      pdf.setFontSize(fontSize);
      pdf.setFont(undefined, 'bold');
      pdf.text(key, x, currentY);
      
      // Add value
      pdf.setFont(undefined, 'normal');
      const valueLines = pdf.splitTextToSize(value, valueWidth);
      let valueY = currentY;
      for (const line of valueLines) {
        pdf.text(line, valueX, valueY);
        valueY += lineHeight;
      }
      currentY = valueY + lineHeight;
    };

    // Helper function to add a horizontal line
    const addHorizontalLine = () => {
      currentY += lineHeight;
      pdf.setLineWidth(0.2); // Thinner line
      pdf.setDrawColor(128, 128, 128); // Grey color
      pdf.line(marginMM, currentY, marginMM + contentWidth, currentY);
      currentY += lineHeight * 2;
    };

    // Helper function to add centered text
    const addCenteredText = (text: string, fontSize: number, isBold: boolean = false) => {
      pdf.setFontSize(fontSize);
      if (isBold) {
        pdf.setFont(undefined, 'bold');
      } else {
        pdf.setFont(undefined, 'normal');
      }
      
      const textWidth = pdf.getTextWidth(text);
      const centerX = marginMM + (contentWidth / 2) - (textWidth / 2);
      pdf.text(text, centerX, currentY);
      currentY += lineHeight;
    };

    // Main Title
    addCenteredText('Job Information', titleFontSize);
    addCenteredText('Generated by JOT Snatcher Extension', fontSize, false);
    currentY += lineHeight; // Add space after title

    // Job Details Section
    addSectionHeader('Job Details');
    addKeyValue('Position:', jobData.position || 'Not specified');
    addKeyValue('Company:', jobData.organization || 'Not specified');
    addKeyValue('Location:', jobData.location || 'Not specified');
    addKeyValue('Salary:', jobData.salary || 'Not specified');
    addKeyValue('Job Type:', jobData.type || 'Not specified');
    addKeyValue('Work Environment:', jobData.environment || 'Not specified');

    // Job Information Section
    addSectionHeader('Job Information');
    addKeyValue('Source:', jobData.job_site || 'Unknown');
    addKeyValue('Stage:', jobData.stage || 'Saved');
    addKeyValue('Date Saved:', new Date(jobData.date_saved).toLocaleDateString());
    addKeyValue('Date Posted:', jobData.date_posted ? new Date(jobData.date_posted).toLocaleDateString() : 'Not specified');

    // Job Links Section
    addSectionHeader('Job Links');
    addKeyValue('Job Posting URL:', jobData.job_posting_url || jobData.link || 'Not specified');

    // Job Description Section - Always start on second page
    if (jobData.description && jobData.description.trim()) {
      // Force a new page for Job Description
      pdf.addPage();
      this.addFooter(pdf, marginMM, contentWidth, contentHeight);
      
      // Reset currentY for the new page
      currentY = marginMM;
      
      // Add Job Description header with same size as other sections
      addSectionHeader('Job Description');
      
      // For job description, we'll use a different approach to handle long text
      this.addJobDescription(pdf, jobData.description, marginMM, contentWidth, contentHeight, currentY);
    } else {
      // Add footer to the first page if no description
      this.addFooter(pdf, marginMM, contentWidth, contentHeight);
    }
  }

  private static addJobDescription(pdf: any, description: string, marginMM: number, contentWidth: number, contentHeight: number, startY: number): void {
    let currentY = startY;
    const lineHeight = 6; // mm
    const fontSize = 12;

    pdf.setFontSize(fontSize);
    pdf.setFont(undefined, 'normal');

    // Split description into lines that fit within content width
    const lines = pdf.splitTextToSize(description, contentWidth);
    
    for (const line of lines) {
      // Check if we need a new page
      if (currentY + lineHeight > marginMM + contentHeight - 20) { // Leave space for footer
        pdf.addPage();
        currentY = marginMM;
        this.addFooter(pdf, marginMM, contentWidth, contentHeight);
      }
      
      pdf.text(line, marginMM, currentY);
      currentY += lineHeight;
    }
  }

  private static addFooter(pdf: any, marginMM: number, contentWidth: number, contentHeight: number): void {
    const footerY = marginMM + contentHeight + 5; // 5mm below content area
    const pageNumber = pdf.internal.getCurrentPageInfo().pageNumber;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    
    // Add page number centered at bottom
    const pageText = `Page ${pageNumber}`;
    const textWidth = pdf.getTextWidth(pageText);
    const centerX = marginMM + (contentWidth / 2) - (textWidth / 2);
    
    pdf.text(pageText, centerX, footerY);
  }

  private static generateFileName(jobData: JobData): string {
    // Clean company name for filename (remove special characters)
    const cleanCompanyName = jobData.organization
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length
    
    // Get current date in MM_DD_YY format
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    
    return `${cleanCompanyName}-${month}_${day}_${year}.pdf`;
  }

  private static generateJobDataHTML(jobData: JobData): string {
    const formatDate = (dateString: string | null) => {
      if (!dateString) return 'Not specified';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatSalary = (jobData: JobData) => {
      if (jobData.salary) {
        return jobData.salary;
      }
      if (jobData.salary_min && jobData.salary_max) {
        return `$${jobData.salary_min.toLocaleString()} - $${jobData.salary_max.toLocaleString()} ${jobData.salary_type || 'per year'}`;
      }
      return 'Not specified';
    };

    return `
      <div style="max-width: 100%;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
          <h1 style="color: #1f2937; font-size: 28px; margin: 0 0 10px 0; font-weight: bold;">Job Information</h1>
          <p style="color: #6b7280; font-size: 16px; margin: 0;">Generated by JOT Snatcher Extension</p>
        </div>

        <div style="margin-bottom: 25px;">
          <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 15px 0; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Job Details</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <h3 style="color: #374151; font-size: 16px; margin: 0 0 8px 0; font-weight: bold;">Position</h3>
              <p style="color: #1f2937; font-size: 14px; margin: 0; word-wrap: break-word;">${jobData.position}</p>
            </div>
            
            <div>
              <h3 style="color: #374151; font-size: 16px; margin: 0 0 8px 0; font-weight: bold;">Company</h3>
              <p style="color: #1f2937; font-size: 14px; margin: 0; word-wrap: break-word;">${jobData.organization}</p>
            </div>
            
            <div>
              <h3 style="color: #374151; font-size: 16px; margin: 0 0 8px 0; font-weight: bold;">Location</h3>
              <p style="color: #1f2937; font-size: 14px; margin: 0; word-wrap: break-word;">${jobData.location}</p>
            </div>
            
            <div>
              <h3 style="color: #374151; font-size: 16px; margin: 0 0 8px 0; font-weight: bold;">Salary</h3>
              <p style="color: #1f2937; font-size: 14px; margin: 0; word-wrap: break-word;">${formatSalary(jobData)}</p>
            </div>
            
            <div>
              <h3 style="color: #374151; font-size: 16px; margin: 0 0 8px 0; font-weight: bold;">Job Type</h3>
              <p style="color: #1f2937; font-size: 14px; margin: 0; word-wrap: break-word;">${jobData.type}</p>
            </div>
            
            <div>
              <h3 style="color: #374151; font-size: 16px; margin: 0 0 8px 0; font-weight: bold;">Work Environment</h3>
              <p style="color: #1f2937; font-size: 14px; margin: 0; word-wrap: break-word;">${jobData.environment}</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 15px 0; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Job Information</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <h3 style="color: #374151; font-size: 16px; margin: 0 0 8px 0; font-weight: bold;">Source</h3>
              <p style="color: #1f2937; font-size: 14px; margin: 0; word-wrap: break-word;">${jobData.job_site}</p>
            </div>
            
            <div>
              <h3 style="color: #374151; font-size: 16px; margin: 0 0 8px 0; font-weight: bold;">Stage</h3>
              <p style="color: #1f2937; font-size: 14px; margin: 0; word-wrap: break-word;">${jobData.stage}</p>
            </div>
            
            <div>
              <h3 style="color: #374151; font-size: 16px; margin: 0 0 8px 0; font-weight: bold;">Date Saved</h3>
              <p style="color: #1f2937; font-size: 14px; margin: 0; word-wrap: break-word;">${formatDate(jobData.date_saved)}</p>
            </div>
            
            <div>
              <h3 style="color: #374151; font-size: 16px; margin: 0 0 8px 0; font-weight: bold;">Date Posted</h3>
              <p style="color: #1f2937; font-size: 14px; margin: 0; word-wrap: break-word;">${formatDate(jobData.date_posted)}</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 15px 0; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Job Links</h2>
          
          <div style="margin-bottom: 15px;">
            <h3 style="color: #374151; font-size: 16px; margin: 0 0 8px 0; font-weight: bold;">Job Posting URL</h3>
            <p style="color: #1f2937; font-size: 14px; margin: 0; word-wrap: break-word; word-break: break-all;">${jobData.job_posting_url}</p>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 15px 0; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Job Description</h2>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="color: #1f2937; font-size: 14px; margin: 0; white-space: pre-wrap; word-wrap: break-word;">${jobData.description || 'No description available'}</p>
          </div>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">Generated on ${new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })} by JOT Snatcher Extension</p>
        </div>
      </div>
    `;
  }
}
