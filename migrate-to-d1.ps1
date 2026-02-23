# Migration script to copy all data from local D1 to remote D1

Write-Host "Starting migration from local to remote D1..." -ForegroundColor Green

# Tables to migrate in order (respecting foreign key constraints)
$tables = @(
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

Write-Host "`nStep 1: Backing up local data..." -ForegroundColor Yellow

# Export all data from local database
foreach ($table in $tables) {
    Write-Host "Exporting $table..." -ForegroundColor Cyan
    
    # Get data from local database
    $result = wrangler d1 execute eclassroom --local --command "SELECT * FROM $table" --json 2>$null | ConvertFrom-Json
    
    if ($result -and $result.results -and $result.results.Count -gt 0) {
        # Save to JSON file
        $result.results | ConvertTo-Json -Depth 10 | Out-File -FilePath "backup_$table.json" -Encoding UTF8
        Write-Host "  Exported $($result.results.Count) rows from $table" -ForegroundColor Green
    } else {
        Write-Host "  No data in $table" -ForegroundColor Gray
    }
}

Write-Host "`nStep 2: Clearing remote database data (keeping schema)..." -ForegroundColor Yellow

# Clear remote data in reverse order (respecting foreign keys)
$reverseTables = $tables.Clone()
[array]::Reverse($reverseTables)

foreach ($table in $reverseTables) {
    Write-Host "Clearing $table..." -ForegroundColor Cyan
    wrangler d1 execute eclassroom --remote --command "DELETE FROM $table" 2>$null | Out-Null
}

Write-Host "`nStep 3: Importing data to remote database..." -ForegroundColor Yellow

# Import data to remote database
foreach ($table in $tables) {
    $backupFile = "backup_$table.json"
    
    if (Test-Path $backupFile) {
        $data = Get-Content $backupFile -Raw | ConvertFrom-Json
        
        if ($data.Count -gt 0) {
            Write-Host "Importing $($data.Count) rows to $table..." -ForegroundColor Cyan
            
            # Get column names from first row
            $columns = $data[0].PSObject.Properties.Name
            $columnList = $columns -join ", "
            
            # Create batches of 50 rows each (D1 has size limits)
            $batchSize = 50
            $batches = [Math]::Ceiling($data.Count / $batchSize)
            
            for ($i = 0; $i -lt $batches; $i++) {
                $start = $i * $batchSize
                $end = [Math]::Min(($i + 1) * $batchSize, $data.Count) - 1
                $batch = $data[$start..$end]
                
                # Build INSERT statements
                $values = @()
                foreach ($row in $batch) {
                    $valueList = @()
                    foreach ($col in $columns) {
                        $val = $row.$col
                        if ($null -eq $val -or ($val -is [string] -and $val -eq 'null')) {
                            # Treat both PowerShell $null and the string literal "null" as SQL NULL
                            $valueList += "NULL"
                        } elseif ($val -is [string]) {
                            $escaped = $val -replace "'", "''"
                            $valueList += "'$escaped'"
                        } else {
                            $valueList += "$val"
                        }
                    }
                    $values += "(" + ($valueList -join ", ") + ")"
                }
                
                $insertSql = "INSERT INTO $table ($columnList) VALUES " + ($values -join ", ")
                
                # Execute batch insert
                $tempFile = "temp_insert_$table_$i.sql"
                $insertSql | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline
                
                try {
                    wrangler d1 execute eclassroom --remote --file=$tempFile 2>&1 | Out-Null
                    Write-Host "  Batch $($i + 1)/$batches completed" -ForegroundColor Green
                } catch {
                    Write-Host "  Error in batch $($i + 1): $_" -ForegroundColor Red
                }
                
                Remove-Item $tempFile -ErrorAction SilentlyContinue
            }
        }
    }
}

Write-Host "`nStep 4: Cleaning up backup files..." -ForegroundColor Yellow
Remove-Item backup_*.json -ErrorAction SilentlyContinue

Write-Host "`nMigration completed!" -ForegroundColor Green
Write-Host "`nVerifying migration..." -ForegroundColor Yellow

# Verify counts
foreach ($table in $tables) {
    $localCount = wrangler d1 execute eclassroom --local --command "SELECT COUNT(*) as count FROM $table" --json 2>$null | ConvertFrom-Json
    $remoteCount = wrangler d1 execute eclassroom --remote --command "SELECT COUNT(*) as count FROM $table" --json 2>$null | ConvertFrom-Json
    
    $local = if ($localCount.results) { $localCount.results[0].count } else { 0 }
    $remote = if ($remoteCount.results) { $remoteCount.results[0].count } else { 0 }
    
    $status = if ($local -eq $remote) { "[OK]" } else { "[MISMATCH]" }
    $color = if ($local -eq $remote) { "Green" } else { "Red" }
    
    Write-Host "$status $table : Local=$local, Remote=$remote" -ForegroundColor $color
}

Write-Host "`nDone!" -ForegroundColor Green
