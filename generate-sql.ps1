# Generate SQL INSERT statements from JSON backups

$outputFile = "full-migration.sql"
Remove-Item $outputFile -ErrorAction SilentlyContinue

# Tables in correct dependency order
$tableOrder = @(
    "school_info",
    "departments",
    "users",
    "timetable_weeks",
    "sessions",
    "time_slots",
    "room_groups",
    "classrooms",
    "equipment",
    "classroom_equipment",
    "bookings",
    "holidays",
    "disabled_periods"
)

# Start with PRAGMA and clearing data
@"
-- Full database migration from local to remote
-- Generated: $(Get-Date)

PRAGMA foreign_keys = OFF;

-- Clear existing data (reverse order for foreign keys)
DELETE FROM bookings;
DELETE FROM classroom_equipment;
DELETE FROM classrooms;
DELETE FROM equipment;
DELETE FROM room_groups;
DELETE FROM holidays;
DELETE FROM disabled_periods;
DELETE FROM time_slots;
DELETE FROM sessions;
DELETE FROM timetable_weeks;
DELETE FROM users;
DELETE FROM departments;
DELETE FROM school_info;
DELETE FROM password_reset_attempts;

"@ | Out-File -FilePath $outputFile -Encoding UTF8

# Process each table in order
foreach ($tableName in $tableOrder) {
    $backupFile = "backup_$tableName.json"
    
    if (-not (Test-Path $backupFile)) {
        Write-Host "Skipping $tableName (no backup file)" -ForegroundColor Gray
        continue
    }
    
    Write-Host "Processing $tableName..." -ForegroundColor Cyan
    
    $data = Get-Content $backupFile -Raw | ConvertFrom-Json
    
    if ($data -and $data.Count -gt 0) {
        "`n-- Inserting $($data.Count) rows into $tableName" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        
        # Get columns from first row
        $columns = $data[0].PSObject.Properties.Name
        $columnList = ($columns | ForEach-Object { "[$_]" }) -join ", "
        
        # Generate INSERT statements (batch by 100)
        $batchSize = 100
        for ($i = 0; $i -lt $data.Count; $i += $batchSize) {
            $end = [Math]::Min($i + $batchSize, $data.Count)
            $batch = $data[$i..($end-1)]
            
            $values = @()
            foreach ($row in $batch) {
                $valueList = @()
                foreach ($col in $columns) {
                    $val = $row.$col
                    if ($null -eq $val -or ($val -is [string] -and $val -eq 'null')) {
                        # Treat both PowerShell $null and the string literal "null" as SQL NULL
                        $valueList += "NULL"
                    } elseif ($val -is [string]) {
                        # Escape single quotes
                        $escaped = $val -replace "'", "''"
                        $valueList += "'$escaped'"
                    } elseif ($val -is [bool]) {
                        $valueList += if ($val) { "1" } else { "0" }
                    } else {
                        $valueList += "$val"
                    }
                }
                $values += "  (" + ($valueList -join ", ") + ")"
            }
            
            "INSERT INTO $tableName ($columnList) VALUES" | Out-File -FilePath $outputFile -Append -Encoding UTF8
            ($values -join ",`n") + ";" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        }
    }
}

"`n`nPRAGMA foreign_keys = ON;" | Out-File -FilePath $outputFile -Append -Encoding UTF8

Write-Host "`nSQL migration file generated: $outputFile" -ForegroundColor Green
Write-Host "File size: $([Math]::Round((Get-Item $outputFile).Length / 1KB, 2)) KB" -ForegroundColor Yellow
