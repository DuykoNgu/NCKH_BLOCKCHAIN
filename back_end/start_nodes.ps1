# EduChain Multi-Node Simulation Script
# This script starts 3 nodes on localhost with different ports

$PythonPath = "python" # Update this if python is not in your PATH

# Create separate terminal windows for each node
# Node 0: Port 5000 (Validator 0)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PSScriptRoot; $PythonPath run.py --port 5000 --validator 0" -WindowStyle Normal

# Node 1: Port 5001 (Validator 1)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PSScriptRoot; $PythonPath run.py --port 5001 --validator 1" -WindowStyle Normal

# Node 2: Port 5002 (Validator 2)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PSScriptRoot; $PythonPath run.py --port 5002 --validator 2" -WindowStyle Normal

Write-Host "EduChain Simulation Started!" -ForegroundColor Green
Write-Host "- Node 0: http://127.0.0.1:5000 (MOET)"
Write-Host "- Node 1: http://127.0.0.1:5001 (Uni A)"
Write-Host "- Node 2: http://127.0.0.1:5002 (Uni B)"
Write-Host "Check the new PowerShell windows for node logs."
