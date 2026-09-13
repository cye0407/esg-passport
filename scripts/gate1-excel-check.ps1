# Gate 1, the Excel half. Opens every workbook gate1-roundtrip.mjs wrote to
# testing/benchmark/out/ in desktop Excel with CorruptLoad = xlNormalLoad (no silent
# repair allowed), reads the probe cells named in the sidecar JSON back, and — where the
# workbook has formulas — forces a recalculation and reports a cell so stale cached values
# would show. No library can stand in for this step: it is Excel's own parser.
#
# Usage:  powershell -File scripts/gate1-excel-check.ps1
# Needs desktop Excel on this machine. Runs invisibly; closes everything it opens.

$ErrorActionPreference = 'Stop'
$outDir = Join-Path $PSScriptRoot '..\testing\benchmark\out'
$files = Get-ChildItem -Path $outDir -Filter '*-completed.xlsx' | Sort-Object Name
if ($files.Count -eq 0) { Write-Output "nothing to check in $outDir - run node scripts/gate1-roundtrip.mjs first"; exit 1 }

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$passed = 0
try {
  foreach ($f in $files) {
    $sidecar = Get-Content ($f.FullName -replace '\.xlsx$', '.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    try {
      # Open(Filename, UpdateLinks, ReadOnly, Format, Password, WriteResPassword, IgnoreReadOnlyRecommended,
      #      Origin, Delimiter, Editable, Notify, Converter, AddToMru, Local, CorruptLoad)  CorruptLoad 0 = xlNormalLoad
      $wb = $excel.Workbooks.Open($f.FullName, 0, $true, 5, '', '', $true, 2, '', $false, $false, 0, $false, $true, 0)
      $ok = $true
      $read = @()
      foreach ($p in $sidecar.probe) {
        $ws = $wb.Worksheets.Item($p.sheet)
        $got = [string]$ws.Range($p.cell).Text
        if ($got -ne $p.value) { $ok = $false }
        $read += ('{0}!{1}={2}' -f $p.sheet, $p.cell, $got)
      }
      $recalc = ''
      if ($sidecar.formulas -gt 0) {
        $excel.CalculateFull()
        $recalc = ' | recalculated ' + $sidecar.formulas + ' formulas'
      }
      $wb.Close($false)
      if ($ok) { $passed++ }
      Write-Output ('{0,-45} {1}  {2}{3}' -f $f.Name, $(if ($ok) { 'OPENED' } else { 'VALUE MISMATCH' }), ($read -join ' | '), $recalc)
    } catch {
      Write-Output ('{0,-45} FAILED  {1}' -f $f.Name, $_.Exception.Message)
    }
  }
} finally {
  $excel.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
Write-Output ('{0}/{1} opened in Excel with no repair and the probe answers read back' -f $passed, $files.Count)
if ($passed -ne $files.Count) { exit 1 }
