import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function exportElementToPNG(el: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(el, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
  })
  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export async function exportElementsToPDF(elements: (HTMLElement | undefined)[], filename: string): Promise<void> {
  const validElements = elements.filter((el): el is HTMLElement => el instanceof HTMLElement)
  if (validElements.length === 0) return

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [960, 540] })

  for (let i = 0; i < validElements.length; i++) {
    if (i > 0) pdf.addPage()
    const el = validElements[i]!
    const canvas = await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    })
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', 0, 0, 960, 540)
  }

  pdf.save(`${filename}.pdf`)
}
