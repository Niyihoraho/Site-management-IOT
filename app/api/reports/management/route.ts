import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'comprehensive'
    const siteId = searchParams.get('siteId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Fetch all data
    const [workers, attendance, payroll, sites, jobTypes] = await Promise.all([
      prisma.worker.findMany({
        include: {
          jobType: true,
          assignedSite: true
        }
      }),
      prisma.attendanceRecord.findMany({
        include: {
          worker: {
            include: {
              jobType: true,
              assignedSite: true
            }
          },
          site: true
        },
        orderBy: {
          attendanceDate: 'desc'
        }
      }),
      prisma.payrollRecord.findMany({
        include: {
          worker: {
            include: {
              jobType: true,
              assignedSite: true
            }
          },
          site: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.constructionSite.findMany({
        include: {
          _count: {
            select: {
              workers: true
            }
          }
        }
      }),
      prisma.jobType.findMany()
    ])

    // Calculate comprehensive statistics
    const today = new Date().toISOString().split('T')[0]
    const todayAttendance = attendance.filter(record => 
      record.attendanceDate.toISOString().split('T')[0] === today
    )

    const presentToday = todayAttendance.filter(record => 
      record.status === 'PRESENT' || record.status === 'LATE' || record.status === 'OVERTIME'
    ).length

    const totalAttendanceDays = attendance.filter(record => 
      record.status === 'PRESENT' || record.status === 'LATE' || record.status === 'OVERTIME'
    ).length

    const pendingPayroll = payroll.filter(record => record.paymentStatus === 'PENDING')
    const paidPayroll = payroll.filter(record => record.paymentStatus === 'PAID')

    const totalAmountPending = pendingPayroll.reduce((sum, record) => sum + Number(record.netPay || 0), 0)
    const totalAmountPaid = paidPayroll.reduce((sum, record) => sum + Number(record.netPay || 0), 0)

    // Site performance analysis
    const sitePerformance = sites.map(site => {
      const siteWorkers = workers.filter(worker => worker.assignedSiteId === site.id)
      const siteAttendance = attendance.filter(record => record.siteId === site.id)
      const sitePayroll = payroll.filter(record => record.siteId === site.id)

      const presentWorkers = siteAttendance.filter(record => 
        record.status === 'PRESENT' || record.status === 'LATE' || record.status === 'OVERTIME'
      ).length

      const totalHours = siteAttendance.reduce((sum, record) => 
        sum + Number(record.totalHours || 0), 0
      )

      const totalPayrollAmount = sitePayroll.reduce((sum, record) => 
        sum + Number(record.netPay || 0), 0
      )

      return {
        siteName: site.siteName,
        totalWorkers: siteWorkers.length,
        presentWorkers,
        totalHours,
        totalPayrollAmount,
        efficiency: siteWorkers.length > 0 ? (presentWorkers / siteWorkers.length) * 100 : 0
      }
    })

    // Worker performance analysis
    const workerPerformance = workers.map(worker => {
      const workerAttendance = attendance.filter(record => record.workerId === worker.id)
      const workerPayroll = payroll.filter(record => record.workerId === worker.id)

      const totalDays = workerAttendance.length
      const presentDays = workerAttendance.filter(record => 
        record.status === 'PRESENT' || record.status === 'LATE' || record.status === 'OVERTIME'
      ).length

      const totalHours = workerAttendance.reduce((sum, record) => 
        sum + Number(record.totalHours || 0), 0
      )

      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0

      const latestPayroll = workerPayroll.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]

      return {
        employeeId: worker.employeeId,
        name: `${worker.firstName} ${worker.lastName}`,
        jobType: worker.jobType?.jobTitle || 'N/A',
        site: worker.assignedSite?.siteName || 'N/A',
        totalDays,
        presentDays,
        attendanceRate,
        totalHours,
        latestPayrollAmount: latestPayroll ? Number(latestPayroll.netPay || 0) : 0,
        status: latestPayroll?.paymentStatus || 'N/A'
      }
    })

    // Generate PDF report
    const pdf = new jsPDF()
    
    // Set up PDF styling
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    let yPosition = 20

    // Helper function to add text with word wrap
    const addText = (text: string, x: number, y: number, maxWidth?: number, fontSize: number = 12) => {
      pdf.setFontSize(fontSize)
      if (maxWidth) {
        const lines = pdf.splitTextToSize(text, maxWidth)
        pdf.text(lines, x, y)
        return y + (lines.length * (fontSize * 0.4))
      } else {
        pdf.text(text, x, y)
        return y + (fontSize * 0.4)
      }
    }

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        pdf.addPage()
        yPosition = 20
        return true
      }
      return false
    }

    // Title Page
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.text('SITE MANAGEMENT SYSTEM', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'normal')
    pdf.text('COMPREHENSIVE MANAGEMENT REPORT', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 10

    pdf.setFontSize(12)
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 20

    // Executive Summary
    checkNewPage(60)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    yPosition = addText('EXECUTIVE SUMMARY', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    
    const summaryData = [
      ['Total Workers', workers.length.toString()],
      ['Active Sites', sites.filter(s => s.status === 'ACTIVE').length.toString()],
      ['Present Today', presentToday.toString()],
      ['Total Attendance Days', totalAttendanceDays.toString()],
      ['Pending Payments', pendingPayroll.length.toString()],
      ['Completed Payments', paidPayroll.length.toString()],
      ['Total Pending Amount', `RF ${totalAmountPending.toLocaleString()}`],
      ['Total Paid Amount', `RF ${totalAmountPaid.toLocaleString()}`]
    ]

    // Add summary table
    autoTable(pdf, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 }
    })

    yPosition = (pdf as any).lastAutoTable.finalY + 15

    // Attendance Analysis
    checkNewPage(80)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    yPosition = addText('ATTENDANCE ANALYSIS', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    
    const attendanceStats = [
      ['Total Records', attendance.length.toString()],
      ['Present Records', attendance.filter(r => r.status === 'PRESENT').length.toString()],
      ['Late Records', attendance.filter(r => r.status === 'LATE').length.toString()],
      ['Absent Records', attendance.filter(r => r.status === 'ABSENT').length.toString()],
      ['Overtime Records', attendance.filter(r => r.status === 'OVERTIME').length.toString()],
      ['Average Hours per Day', (attendance.reduce((sum, r) => sum + Number(r.totalHours || 0), 0) / Math.max(attendance.length, 1)).toFixed(2)]
    ]

    autoTable(pdf, {
      startY: yPosition,
      head: [['Attendance Metric', 'Count']],
      body: attendanceStats,
      theme: 'grid',
      headStyles: { fillColor: [39, 174, 96] },
      styles: { fontSize: 10 }
    })

    yPosition = (pdf as any).lastAutoTable.finalY + 15

    // Payroll Analysis
    checkNewPage(80)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    yPosition = addText('PAYROLL ANALYSIS', 20, yPosition)
    yPosition += 10

    const payrollStats = [
      ['Total Payroll Records', payroll.length.toString()],
      ['Pending Payments', pendingPayroll.length.toString()],
      ['Paid Payments', paidPayroll.length.toString()],
      ['Total Pending Amount', `RF ${totalAmountPending.toLocaleString()}`],
      ['Total Paid Amount', `RF ${totalAmountPaid.toLocaleString()}`],
      ['Average Payment Amount', `RF ${(totalAmountPaid / Math.max(paidPayroll.length, 1)).toLocaleString()}`]
    ]

    autoTable(pdf, {
      startY: yPosition,
      head: [['Payroll Metric', 'Value']],
      body: payrollStats,
      theme: 'grid',
      headStyles: { fillColor: [230, 126, 34] },
      styles: { fontSize: 10 }
    })

    yPosition = (pdf as any).lastAutoTable.finalY + 15

    // Site Performance
    checkNewPage(100)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    yPosition = addText('SITE PERFORMANCE METRICS', 20, yPosition)
    yPosition += 10

    const siteTableData = sitePerformance.map(site => [
      site.siteName,
      site.totalWorkers.toString(),
      site.presentWorkers.toString(),
      site.totalHours.toFixed(1),
      `RF ${site.totalPayrollAmount.toLocaleString()}`,
      `${site.efficiency.toFixed(1)}%`
    ])

    autoTable(pdf, {
      startY: yPosition,
      head: [['Site', 'Workers', 'Present', 'Hours', 'Payroll', 'Efficiency']],
      body: siteTableData,
      theme: 'grid',
      headStyles: { fillColor: [155, 89, 182] },
      styles: { fontSize: 9 }
    })

    yPosition = (pdf as any).lastAutoTable.finalY + 15

    // Worker Performance (Top 10)
    checkNewPage(120)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    yPosition = addText('TOP WORKER PERFORMANCE', 20, yPosition)
    yPosition += 10

    const topWorkers = workerPerformance
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 10)

    const workerTableData = topWorkers.map(worker => [
      worker.employeeId,
      worker.name,
      worker.jobType,
      worker.site,
      worker.presentDays.toString(),
      `${worker.attendanceRate.toFixed(1)}%`,
      worker.totalHours.toFixed(1),
      `RF ${worker.latestPayrollAmount.toLocaleString()}`
    ])

    autoTable(pdf, {
      startY: yPosition,
      head: [['ID', 'Name', 'Job Type', 'Site', 'Days', 'Rate %', 'Hours', 'Payroll']],
      body: workerTableData,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] },
      styles: { fontSize: 8 }
    })

    yPosition = (pdf as any).lastAutoTable.finalY + 15

    // Financial Summary
    checkNewPage(60)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    yPosition = addText('FINANCIAL SUMMARY', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    
    const financialData = [
      ['Total Payroll Budget', `RF ${(totalAmountPending + totalAmountPaid).toLocaleString()}`],
      ['Amount Paid', `RF ${totalAmountPaid.toLocaleString()}`],
      ['Amount Pending', `RF ${totalAmountPending.toLocaleString()}`],
      ['Payment Completion Rate', `${((paidPayroll.length / Math.max(payroll.length, 1)) * 100).toFixed(1)}%`]
    ]

    autoTable(pdf, {
      startY: yPosition,
      head: [['Financial Metric', 'Amount']],
      body: financialData,
      theme: 'grid',
      headStyles: { fillColor: [231, 76, 60] },
      styles: { fontSize: 10 }
    })

    yPosition = (pdf as any).lastAutoTable.finalY + 15

    // Recommendations
    checkNewPage(80)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    yPosition = addText('MANAGEMENT RECOMMENDATIONS', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    
    const recommendations = [
      `• ${pendingPayroll.length} payments are pending - consider processing to improve cash flow`,
      `• Average attendance rate: ${(totalAttendanceDays / Math.max(workers.length, 1)).toFixed(1)} days per worker`,
      `• Total payroll liability: RF ${totalAmountPending.toLocaleString()}`,
      `• Consider implementing attendance incentives for workers with low attendance rates`,
      `• Monitor site efficiency metrics to identify underperforming locations`
    ]

    recommendations.forEach(rec => {
      yPosition = addText(rec, 20, yPosition, pageWidth - 40)
      yPosition += 5
    })

    // Footer
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'italic')
    pdf.text('This report was generated automatically by the Site Management System', pageWidth / 2, pageHeight - 10, { align: 'center' })

    // Convert to buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="management-report-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    })

  } catch (error) {
    console.error('Error generating management report:', error)
    return NextResponse.json(
      { error: 'Failed to generate management report' },
      { status: 500 }
    )
  }
}
