$line = (Get-Content "C:\Users\moham\.gemini\antigravity\brain\78ef216e-713d-4ff2-be90-11507eedefbc\.system_generated\logs\overview.txt" -TotalCount 34)[-1]
$data = $line | ConvertFrom-Json
$data.content | Out-File -FilePath "backend_code.txt" -Encoding utf8
