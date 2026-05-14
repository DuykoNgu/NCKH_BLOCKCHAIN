import { useState, useRef, useCallback } from 'react';
import {
    FileText, Upload, CheckCircle, AlertCircle, Loader2, X,
    FolderOpen, FileSpreadsheet, Play, Download, RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { NFTService } from '@/services/nftService';
import { usePassword } from '@/hooks/usePassword';
import { signDataWithBytes } from '@/utils/signatureUtils';
import { decryptPrivateKey } from '@/utils/cryptoVault';
import * as XLSX from 'xlsx';

// ────────────────────────────── Types ──────────────────────────────

interface NFTBatchCreateProps {
    account: string;
}

interface ExcelRow {
    MaSV: string;
    DiaChiVi: string;
    LoaiBangCap: string;
}

interface ValidationResult {
    valid: boolean;
    matched: string[];
    missingPdfs: string[];
    extraPdfs: string[];
    totalExcel: number;
    totalPdf: number;
}

interface MintResult {
    studentId: string;
    status: 'success' | 'error' | 'pending';
    tokenId?: string;
    txHash?: string;
    errorMessage?: string;
}

type BatchPhase = 'idle' | 'validated' | 'uploading' | 'minting' | 'done';

// ─────────────────────── Helper: sort object keys ───────────────────────

const sortObjectKeys = <T extends Record<string, unknown>>(obj: T): T => {
    const sorted = {} as T;
    (Object.keys(obj).sort() as Array<keyof T>).forEach((k) => {
        sorted[k] = obj[k];
    });
    return sorted;
};

// ─────────────────────── Helper: export CSV ─────────────────────────────

function exportReportCSV(results: MintResult[]) {
    const header = 'MaSV,Trang Thai,Token ID,Tx Hash,Loi\n';
    const rows = results.map((r) =>
        [
            r.studentId,
            r.status === 'success' ? 'Thanh cong' : 'That bai',
            r.tokenId ?? '',
            r.txHash ?? '',
            r.errorMessage ?? '',
        ].join(','),
    );
    const csv = header + rows.join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_mint_report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export const NFTBatchCreate = ({ account }: NFTBatchCreateProps) => {
    const { getPassword, hasPassword } = usePassword();
    const fullname = localStorage.getItem('full_name') || 'Người dùng';

    // ── file refs ──
    const excelInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    // ── data ──
    const [excelRows, setExcelRows] = useState<ExcelRow[]>([]);
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [pdfFiles, setPdfFiles] = useState<File[]>([]);
    const [folderName, setFolderName] = useState('');

    // ── validation ──
    const [validation, setValidation] = useState<ValidationResult | null>(null);

    // ── processing ──
    const [phase, setPhase] = useState<BatchPhase>('idle');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [mintProgress, setMintProgress] = useState(0);
    const [results, setResults] = useState<MintResult[]>([]);
    const [globalError, setGlobalError] = useState<string | null>(null);

    // ═════════════════════ 1. EXCEL HANDLING ═════════════════════

    const handleExcelSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setGlobalError(null);
        setValidation(null);
        setPhase('idle');

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

                // Validate columns
                if (json.length === 0) {
                    setGlobalError('File Excel rỗng, không có dữ liệu.');
                    return;
                }
                const firstRow = json[0];
                const requiredCols = ['MaSV', 'DiaChiVi', 'LoaiBangCap'];
                const missing = requiredCols.filter((c) => !(c in firstRow));
                if (missing.length > 0) {
                    setGlobalError(`Thiếu cột trong Excel: ${missing.join(', ')}. Cần: MaSV, DiaChiVi, LoaiBangCap`);
                    return;
                }

                // Validate rows
                const rows: ExcelRow[] = [];
                for (let i = 0; i < json.length; i++) {
                    const r = json[i];
                    if (!r.MaSV || !r.DiaChiVi || !r.LoaiBangCap) {
                        setGlobalError(`Dòng ${i + 2} trong Excel có dữ liệu rỗng (MaSV, DiaChiVi hoặc LoaiBangCap).`);
                        return;
                    }
                    rows.push({ MaSV: String(r.MaSV).trim(), DiaChiVi: String(r.DiaChiVi).trim(), LoaiBangCap: String(r.LoaiBangCap).trim() });
                }

                setExcelRows(rows);
                setExcelFile(file);
            } catch {
                setGlobalError('Không thể đọc file Excel. Vui lòng kiểm tra định dạng.');
            }
        };
        reader.readAsArrayBuffer(file);
    }, []);

    const handleRemoveExcel = useCallback(() => {
        setExcelRows([]);
        setExcelFile(null);
        setValidation(null);
        setPhase('idle');
        if (excelInputRef.current) excelInputRef.current.value = '';
    }, []);

    // ═════════════════════ 2. PDF FOLDER HANDLING ═════════════════════

    const handleFolderSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setGlobalError(null);
        setValidation(null);
        setPhase('idle');

        const pdfs = Array.from(files).filter((f) => f.name.toLowerCase().endsWith('.pdf'));
        if (pdfs.length === 0) {
            setGlobalError('Folder không chứa file PDF nào.');
            return;
        }

        setPdfFiles(pdfs);
        // Extract folder name from first file's path
        const pathParts = pdfs[0].webkitRelativePath.split('/');
        setFolderName(pathParts.length > 1 ? pathParts[0] : 'Folder');
    }, []);

    const handleRemoveFolder = useCallback(() => {
        setPdfFiles([]);
        setFolderName('');
        setValidation(null);
        setPhase('idle');
        if (folderInputRef.current) folderInputRef.current.value = '';
    }, []);

    // ═════════════════════ 3. CROSS VALIDATION ═════════════════════

    const runValidation = useCallback(() => {
        if (excelRows.length === 0 || pdfFiles.length === 0) return;

        const excelIds = new Set(excelRows.map((r) => r.MaSV));
        const pdfIds = new Set(pdfFiles.map((f) => f.name.replace(/\.pdf$/i, '')));

        const matched = [...excelIds].filter((id) => pdfIds.has(id));
        const missingPdfs = [...excelIds].filter((id) => !pdfIds.has(id));
        const extraPdfs = [...pdfIds].filter((id) => !excelIds.has(id));

        const result: ValidationResult = {
            valid: missingPdfs.length === 0,
            matched,
            missingPdfs,
            extraPdfs,
            totalExcel: excelIds.size,
            totalPdf: pdfIds.size,
        };
        setValidation(result);
        if (result.valid) setPhase('validated');
    }, [excelRows, pdfFiles]);

    // ═════════════════════ 4. BATCH PROCESS (UPLOAD → MINT) ═════════════════════

    const startBatchProcess = useCallback(async () => {
        if (!hasPassword()) {
            setGlobalError('Mật khẩu ví không tìm thấy. Vui lòng đăng nhập lại.');
            return;
        }

        const password = getPassword();
        if (!password) {
            setGlobalError('Mật khẩu ví không tìm thấy.');
            return;
        }

        // Decrypt private key once
        let privateKeyBytes: Uint8Array;
        try {
            const vault = localStorage.getItem('vault');
            if (!vault) throw new Error('Không tìm thấy ví');
            privateKeyBytes = await decryptPrivateKey(JSON.parse(vault), password);
        } catch {
            setGlobalError('Không thể giải mã private key. Vui lòng đăng nhập lại.');
            return;
        }

        // ──── PHASE 2: Upload PDFs + Hash (via Backend) ────
        setPhase('uploading');
        setGlobalError(null);
        setUploadProgress(10); // Bắt đầu

        // Lọc chỉ các file PDF khớp với Excel
        const matchedFiles = pdfFiles.filter((f) => {
            const id = f.name.replace(/\.pdf$/i, '');
            return excelRows.some((r) => r.MaSV === id);
        });

        setUploadProgress(20);

        // Gọi BE batch-upload endpoint
        const uploadResponse = await NFTService.batchUploadPDFs(matchedFiles);
        setUploadProgress(90);

        if (!uploadResponse.success && Object.keys(uploadResponse.data).length === 0) {
            const errorMsg = uploadResponse.errors._general || 'Upload hàng loạt thất bại';
            setGlobalError(errorMsg);
            setPhase('validated');
            return;
        }

        // Kiểm tra thiếu upload
        const pdfMap = uploadResponse.data;
        const missingUploads = excelRows
            .filter((r) => !pdfMap[r.MaSV])
            .map((r) => r.MaSV);

        if (missingUploads.length > 0) {
            const failedDetails = Object.entries(uploadResponse.errors)
                .filter(([k]) => k !== '_general')
                .map(([k, v]) => `${k}: ${v}`)
                .join('; ');
            setGlobalError(
                `Upload thất bại cho: ${missingUploads.join(', ')}. ${failedDetails ? `Chi tiết: ${failedDetails}` : 'Vui lòng thử lại.'}`
            );
            setPhase('validated');
            return;
        }

        setUploadProgress(100);

        // ──── PHASE 3: Signing & Minting ────
        setPhase('minting');
        const total = excelRows.length;
        const mintResults: MintResult[] = [];

        for (let i = 0; i < excelRows.length; i++) {
            const row = excelRows[i];
            const pdfData = pdfMap[row.MaSV];
            const issuedAt = Math.floor(Date.now() / 1000);

            try {
                // Create signing metadata (same pattern as single mint)
                const signingMetadata = {
                    degree_type: row.LoaiBangCap,
                    pdf_url: pdfData.url,
                    pdf_hash: pdfData.hash,
                    institution_address: account,
                    issued_at: issuedAt,
                };
                const sorted = sortObjectKeys(signingMetadata);
                const signingData = JSON.stringify(sorted);
                const signature = signDataWithBytes(signingData, privateKeyBytes);

                // Call the existing single NFT create endpoint
                const response = await NFTService.createNFT({
                    student_id: row.MaSV,
                    degree_type: row.LoaiBangCap,
                    pdf_url: pdfData.url,
                    pdf_hash: pdfData.hash,
                    institution_address: account,
                    recipient_address: row.DiaChiVi,
                    signature,
                    issued_at: issuedAt,
                    institution: fullname,
                });

                if (response.success) {
                    mintResults.push({
                        studentId: row.MaSV,
                        status: 'success',
                        tokenId: response.token_id,
                    });
                } else {
                    mintResults.push({
                        studentId: row.MaSV,
                        status: 'error',
                        errorMessage: response.error || 'Lỗi không xác định',
                    });
                }
            } catch (err) {
                mintResults.push({
                    studentId: row.MaSV,
                    status: 'error',
                    errorMessage: err instanceof Error ? err.message : 'Lỗi không xác định',
                });
            }

            setResults([...mintResults]);
            setMintProgress(Math.round(((i + 1) / total) * 100));
        }

        // ──── PHASE 4: Done ────
        setPhase('done');
    }, [excelRows, pdfFiles, account, fullname, hasPassword, getPassword]);

    // ═════════════════════ RESET ═════════════════════

    const handleReset = useCallback(() => {
        setExcelRows([]);
        setExcelFile(null);
        setPdfFiles([]);
        setFolderName('');
        setValidation(null);
        setPhase('idle');
        setUploadProgress(0);
        setMintProgress(0);
        setResults([]);
        setGlobalError(null);
        if (excelInputRef.current) excelInputRef.current.value = '';
        if (folderInputRef.current) folderInputRef.current.value = '';
    }, []);

    // ═══════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════

    const successCount = results.filter((r) => r.status === 'success').length;
    const errorCount = results.filter((r) => r.status === 'error').length;
    const isProcessing = phase === 'uploading' || phase === 'minting';

    return (
        <Card className="glass-card border-border/50">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black from-violet-500 to-fuchsia-500 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Cấp phát Hàng loạt</CardTitle>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* ──── INSTITUTION INFO (Read-only) ──── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Tổ chức / Trường</Label>
                        <Input value={fullname} readOnly className="bg-muted cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                        <Label>Địa chỉ ví tổ chức</Label>
                        <Input value={account} readOnly className="bg-muted cursor-not-allowed font-mono text-sm" />
                    </div>
                </div>

                {/* ──── EXCEL UPLOAD ──── */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                        File Excel danh sách sinh viên
                    </Label>
                    <input
                        ref={excelInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleExcelSelect}
                        disabled={isProcessing}
                        className="hidden"
                    />

                    {!excelFile ? (
                        <button
                            type="button"
                            onClick={() => excelInputRef.current?.click()}
                            disabled={isProcessing}
                            className="w-full p-4 border-2 border-dashed border-emerald-500/30 rounded-lg hover:border-emerald-500/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2 bg-emerald-500/5"
                        >
                            <Upload className="w-6 h-6 text-emerald-500/70" />
                            <div className="text-center">
                                <p className="text-sm font-medium">Chọn file Excel (.xlsx)</p>
                                <p className="text-xs text-muted-foreground">Cột bắt buộc: MaSV, DiaChiVi, LoaiBangCap</p>
                            </div>
                        </button>
                    ) : (
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                <div>
                                    <p className="text-sm font-medium text-emerald-600">{excelFile.name}</p>
                                    <p className="text-xs text-muted-foreground">{excelRows.length} sinh viên được đọc</p>
                                </div>
                            </div>
                            {!isProcessing && (
                                <button type="button" onClick={handleRemoveExcel} className="p-1 hover:bg-background/50 rounded">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ──── PDF FOLDER UPLOAD ──── */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-blue-500" />
                        Folder chứa file PDF 
                    </Label>
                    <input
                        ref={folderInputRef}
                        type="file"
                        /* @ts-expect-error webkitdirectory is not in HTMLInputElement type */
                        webkitdirectory=""
                        directory=""
                        multiple
                        onChange={handleFolderSelect}
                        disabled={isProcessing}
                        className="hidden"
                    />

                    {pdfFiles.length === 0 ? (
                        <button
                            type="button"
                            onClick={() => folderInputRef.current?.click()}
                            disabled={isProcessing}
                            className="w-full p-4 border-2 border-dashed border-blue-500/30 rounded-lg hover:border-blue-500/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2 bg-blue-500/5"
                        >
                            <FolderOpen className="w-6 h-6 text-blue-500/70" />
                            <div className="text-center">
                                <p className="text-sm font-medium">Chọn folder chứa PDF</p>
                                <p className="text-xs text-muted-foreground">Mỗi file PDF được đặt tên theo Mã sinh viên</p>
                            </div>
                        </button>
                    ) : (
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-blue-500" />
                                <div>
                                    <p className="text-sm font-medium text-blue-600">📁 {folderName}</p>
                                    <p className="text-xs text-muted-foreground">{pdfFiles.length} file PDF</p>
                                </div>
                            </div>
                            {!isProcessing && (
                                <button type="button" onClick={handleRemoveFolder} className="p-1 hover:bg-background/50 rounded">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ──── VALIDATION BUTTON ──── */}
                {excelRows.length > 0 && pdfFiles.length > 0 && !validation && phase === 'idle' && (
                    <Button onClick={runValidation} variant="outline" className="w-full border-amber-500/50 text-amber-600 hover:bg-amber-500/10">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Kiểm tra tính toàn vẹn dữ liệu
                    </Button>
                )}

                {/* ──── VALIDATION RESULTS ──── */}
                {validation && (
                    <div className={`p-4 rounded-lg border ${validation.valid ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-destructive/10 border-destructive/30'}`}>
                        <div className="flex items-start gap-3">
                            {validation.valid ? (
                                <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                            )}
                            <div className="flex-1 space-y-2">
                                <p className={`font-medium ${validation.valid ? 'text-emerald-600' : 'text-destructive'}`}>
                                    {validation.valid
                                        ? `✅ Dữ liệu hợp lệ — ${validation.matched.length} sinh viên khớp hoàn toàn`
                                        : `⚠️ Dữ liệu không khớp`}
                                </p>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p>Excel: {validation.totalExcel} sinh viên | PDF: {validation.totalPdf} files</p>
                                    {validation.missingPdfs.length > 0 && (
                                        <p className="text-destructive">
                                            ❌ Thiếu PDF cho: <strong>{validation.missingPdfs.join(', ')}</strong>
                                        </p>
                                    )}
                                    {validation.extraPdfs.length > 0 && (
                                        <p className="text-amber-600">
                                            ⚠️ PDF thừa (không có trong Excel): {validation.extraPdfs.join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ──── GLOBAL ERROR ──── */}
                {globalError && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                        <p className="text-sm text-destructive">{globalError}</p>
                    </div>
                )}

                {/* ──── PROGRESS: UPLOADING ──── */}
                {phase === 'uploading' && (
                    <div className="space-y-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            <span className="text-sm font-medium text-blue-600">
                                Giai đoạn 2: Upload PDF & tính Hash...
                            </span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">{uploadProgress}%</p>
                    </div>
                )}

                {/* ──── PROGRESS: MINTING ──── */}
                {(phase === 'minting' || phase === 'done') && (
                    <div className="space-y-3 p-4 rounded-lg bg-violet-500/5 border border-violet-500/20">
                        <div className="flex items-center gap-2">
                            {phase === 'minting' ? (
                                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                            ) : (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                            )}
                            <span className="text-sm font-medium text-violet-600">
                                {phase === 'minting' ? 'Giai đoạn 3: Ký & Cấp phát...' : 'Hoàn thành!'}
                            </span>
                        </div>
                        <Progress value={mintProgress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                                ✅ {successCount} thành công | ❌ {errorCount} thất bại
                            </span>
                            <span>{mintProgress}%</span>
                        </div>
                    </div>
                )}

                {/* ──── RESULTS TABLE ──── */}
                {results.length > 0 && (
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                        <div className="max-h-64 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 sticky top-0">
                                    <tr>
                                        <th className="text-left p-2 font-medium">Mã SV</th>
                                        <th className="text-left p-2 font-medium">Trạng thái</th>
                                        <th className="text-left p-2 font-medium">Token ID / Lỗi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((r) => (
                                        <tr key={r.studentId} className="border-t border-border/30">
                                            <td className="p-2 font-mono text-xs">{r.studentId}</td>
                                            <td className="p-2">
                                                {r.status === 'success' ? (
                                                    <span className="text-emerald-600 text-xs font-medium flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" /> Thành công
                                                    </span>
                                                ) : (
                                                    <span className="text-destructive text-xs font-medium flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> Thất bại
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-2 text-xs font-mono truncate max-w-[200px]">
                                                {r.tokenId || r.errorMessage || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ──── ACTION BUTTONS ──── */}
                <div className="flex gap-3">
                    {phase === 'validated' && (
                        <Button onClick={startBatchProcess} className="flex-1 bg-black from-violet-500 to-fuchsia-500 hover:opacity-90 text-white">
                            <Play className="w-4 h-4 mr-2" />
                            Bắt đầu cấp phát ({excelRows.length} sinh viên)
                        </Button>
                    )}

                    {phase === 'done' && (
                        <>
                            <Button onClick={() => exportReportCSV(results)} variant="outline" className="flex-1 border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10">
                                <Download className="w-4 h-4 mr-2" />
                                Xuất báo cáo CSV
                            </Button>
                            <Button onClick={handleReset} variant="outline" className="flex-1">
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Cấp phát đợt mới
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
