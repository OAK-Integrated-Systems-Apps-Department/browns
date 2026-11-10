export const pad = (n: number, l = 4) => String(n).padStart(l, '0')
export const iso = (d: Date) => d.toISOString()
export const dayStr = (off = 0) => { const d = new Date(); d.setDate(d.getDate() + off); return d.toISOString().slice(0, 10) }
export const tsAt = (off = 0, h = 8, m = 0) => { const d = new Date(); d.setDate(d.getDate() + off); d.setHours(h, m, 0, 0); return d.toISOString() }
export const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
export const fmtTime = (s?: string) => (s ? new Date(s).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—')
export const fmtDT = (s?: string) => (s ? `${fmtDate(s)} ${fmtTime(s)}` : '—')
export const money = (n?: number | null) => (n == null || isNaN(n as number) ? '—' : 'LKR ' + Math.round(n).toLocaleString('en-US'))
export const num = (n?: number | null, d = 0) => (n == null || isNaN(n as number) ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d }))
export const short = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'K' : String(Math.round(n)))
export const uid = () => 'TX-' + Math.random().toString(36).slice(2, 8).toUpperCase() + '-' + Date.now().toString(36).slice(-4).toUpperCase()
export const corr = () => 'COR-' + Math.random().toString(16).slice(2, 10).toUpperCase()
export const hoursBetween = (a: string, b: string) => Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 36e5)
export const sum = <T,>(a: T[], f: (x: T) => number) => a.reduce((s, x) => s + (f(x) || 0), 0)
export const groupBy = <T,>(a: T[], f: (x: T) => string) => a.reduce((m: Record<string, T[]>, x) => ((m[f(x)] ||= []).push(x), m), {})
export function downloadCSV(name: string, rows: any[]) {
  if (!rows.length) return
  const keys = Object.keys(rows[0])
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = name + '.csv'
  a.click()
}
export function stampedPhoto(label: string, lat?: number, lng?: number): string {
  const c = document.createElement('canvas'); c.width = 240; c.height = 170
  const x = c.getContext('2d')!
  const g = x.createLinearGradient(0, 0, 240, 170); g.addColorStop(0, '#1d3557'); g.addColorStop(1, '#457b9d')
  x.fillStyle = g; x.fillRect(0, 0, 240, 170)
  x.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 6; i++) x.fillRect(20 + i * 35, 100 - i * 9, 22, 70 + i * 9)
  x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 130, 240, 40)
  x.fillStyle = '#fff'; x.font = '11px sans-serif'
  x.fillText(label.slice(0, 34), 8, 147)
  x.fillText(`${new Date().toLocaleString('en-GB')}${lat ? ` · ${lat.toFixed(4)},${(lng || 0).toFixed(4)}` : ''}`, 8, 163)
  x.font = 'bold 10px sans-serif'; x.fillText('DEMO PHOTO', 8, 14)
  return c.toDataURL('image/jpeg', 0.6)
}
export function fileToThumb(file: File): Promise<string> {
  return new Promise(res => {
    const r = new FileReader()
    r.onload = () => {
      const img = new Image()
      img.onload = () => {
        const s = 240 / Math.max(img.width, img.height); const c = document.createElement('canvas')
        c.width = img.width * s; c.height = img.height * s; c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
        res(c.toDataURL('image/jpeg', 0.6))
      }
      img.onerror = () => res('')
      img.src = r.result as string
    }
    r.readAsDataURL(file)
  })
}
