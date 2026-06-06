param(
    [Parameter(Mandatory = $true)]
    [string]$ArtifactPath,

    [string[]]$Architectures = @(
        "armeabi-v7a",
        "arm64-v8a",
        "x86",
        "x86_64"
    ),

    [string[]]$Libraries = @(
        "libreactnative.so",
        "libhermesvm.so",
        "libc++_shared.so",
        "libfbjni.so",
        "libjsi.so"
    )
)

$resolvedArtifact = Resolve-Path -LiteralPath $ArtifactPath -ErrorAction Stop

Add-Type -AssemblyName System.IO.Compression.FileSystem

$expectedElfMachines = @{
    "armeabi-v7a" = 40
    "arm64-v8a" = 183
    "x86" = 3
    "x86_64" = 62
}

function Get-ElfMachineName {
    param([int]$Machine)

    switch ($Machine) {
        3 { return "x86" }
        40 { return "armeabi-v7a" }
        62 { return "x86_64" }
        183 { return "arm64-v8a" }
        default { return "machine-$Machine" }
    }
}

function Get-ZipEntryElfMachine {
    param(
        [Parameter(Mandatory = $true)]
        [System.IO.Compression.ZipArchiveEntry]$Entry
    )

    $stream = $Entry.Open()
    try {
        $header = New-Object byte[] 20
        $read = $stream.Read($header, 0, $header.Length)
        if ($read -lt $header.Length) {
            return $null
        }

        if ($header[0] -ne 0x7f -or $header[1] -ne 0x45 -or $header[2] -ne 0x4c -or $header[3] -ne 0x46) {
            return $null
        }

        $littleEndian = $header[5] -eq 1
        if ($littleEndian) {
            return [int]($header[18] -bor ($header[19] -shl 8))
        }

        return [int](($header[18] -shl 8) -bor $header[19])
    } finally {
        $stream.Dispose()
    }
}

$zip = [System.IO.Compression.ZipFile]::OpenRead($resolvedArtifact.Path)
try {
    $entryNames = [System.Collections.Generic.HashSet[string]]::new(
        [System.StringComparer]::Ordinal
    )

    foreach ($entry in $zip.Entries) {
        [void]$entryNames.Add($entry.FullName)
    }

    $missing = New-Object System.Collections.Generic.List[string]
    $mismatched = New-Object System.Collections.Generic.List[string]
    $invalidElf = New-Object System.Collections.Generic.List[string]

    foreach ($abi in $Architectures) {
        foreach ($library in $Libraries) {
            $apkEntry = "lib/$abi/$library"
            $aabEntry = "base/lib/$abi/$library"

            if (-not ($entryNames.Contains($apkEntry) -or $entryNames.Contains($aabEntry))) {
                $missing.Add("$abi/$library")
                continue
            }

            $entry = $zip.GetEntry($apkEntry)
            if ($null -eq $entry) {
                $entry = $zip.GetEntry($aabEntry)
            }

            $expectedMachine = $expectedElfMachines[$abi]
            $actualMachine = Get-ZipEntryElfMachine -Entry $entry
            if ($null -eq $actualMachine) {
                $invalidElf.Add("$abi/$library")
                continue
            }

            if ($actualMachine -ne $expectedMachine) {
                $mismatched.Add(
                    "$abi/$library expected $(Get-ElfMachineName $expectedMachine), found $(Get-ElfMachineName $actualMachine)"
                )
            }
        }
    }

    if ($missing.Count -gt 0) {
        Write-Error "Missing native libraries in $($resolvedArtifact.Path): $($missing -join ', ')"
        exit 1
    }

    if ($invalidElf.Count -gt 0) {
        Write-Error "Invalid ELF native libraries in $($resolvedArtifact.Path): $($invalidElf -join ', ')"
        exit 1
    }

    if ($mismatched.Count -gt 0) {
        Write-Error "Mismatched native library architectures in $($resolvedArtifact.Path): $($mismatched -join ', ')"
        exit 1
    }

    Write-Output "Native library check passed for $($resolvedArtifact.Path)"
} finally {
    $zip.Dispose()
}
