# GitHub Workflow Guide

This document provides a quick reference for updating the SmartRead project on GitHub.

## Standard Update Process

When you have made changes to the code and want to upload them to GitHub, follow these steps in your terminal:

### 1. Check Status (Optional but recommended)
See which files have been modified:
```bash
git status
```

### 2. Stage Changes
Add all modified and new files to the staging area:
```bash
git add .
```

### 3. Commit Changes
Commit the staged changes with a descriptive message (preferably in English):
```bash
git commit -m "Your descriptive commit message here"
```
*Example: `git commit -m "Fix highlight rendering bug and add delete feature"`*

### 4. Push to GitHub
Upload the committed changes to the remote repository:
```bash
git push origin main
```
*(Note: If your default branch is `master`, use `git push origin master` instead)*

---

## Quick Update Script (Windows)

If you want to do this in one step, you can create a `update.bat` file in the root directory with the following content:

```bat
@echo off
set /p msg="Enter commit message: "
git add .
git commit -m "%msg%"
git push origin main
echo Done!
pause
```
Then you can just double-click `update.bat` whenever you want to upload your changes.
