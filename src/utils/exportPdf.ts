import { jsPDF } from 'jspdf';
import { SchoolConfig, AttendanceRecord, Student, TeachingJournal, TeacherUser, KalenderHeb } from '../types';
import { SCHOOL_LOGO_PNG_DATA_URL } from '../assets/schoolLogo';
import { generateQrDataUrl } from './qr';

/**
 * Standard Header (KOP Surat) for official school documents
 */
function drawOfficialKop(
  doc: jsPDF,
  schoolConfig: SchoolConfig,
  isLandscape = false
): number {
  const pageWidth = isLandscape ? 297 : 210;
  const centerX = pageWidth / 2;
  const leftX = 15;
  const rightX = pageWidth - 15;

  // Draw Official School Emblem / Logo on the left of Kop
  const logoData = schoolConfig.logoUrl || SCHOOL_LOGO_PNG_DATA_URL;
  if (logoData) {
    try {
      const logoX = isLandscape ? 20 : 16;
      const logoY = 10;
      const logoSize = 19;
      doc.addImage(logoData, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch (e) {
      console.warn('Failed to embed logo in PDF kop:', e);
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(
    'YAYASAN PEMBINA LEMBAGA PENDIDIKAN DASAR DAN MENENGAH (YPLP DIKDASMEN PGRI)',
    centerX,
    13,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(schoolConfig.namaSekolah || 'SMP PGRI 1 CIKADU', centerX, 19, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `NPSN: ${schoolConfig.npsn || '20252876'} | ${schoolConfig.alamat || 'Jl. Raya Cikadu No. 01, Kec. Cikadu, Kab. Cianjur'}`,
    centerX,
    24,
    { align: 'center' }
  );
  doc.text(`Kontak / Telp: ${schoolConfig.kontak || '0857-9812-3456'}`, centerX, 28, { align: 'center' });

  // Official double separator line
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(leftX, 31, rightX, 31);
  doc.setLineWidth(0.25);
  doc.line(leftX, 32.2, rightX, 32.2);

  return 37;
}

/**
 * Standard Signatures Block at end of document
 */
function drawSignatures(
  doc: jsPDF,
  startY: number,
  schoolConfig: SchoolConfig,
  leftTitle = 'Petugas Guru Piket,',
  leftName = schoolConfig.namaPetugasPiket,
  leftNip = schoolConfig.nipPetugasPiket,
  isLandscape = false
): void {
  const pageWidth = isLandscape ? 297 : 210;
  const leftX = isLandscape ? 35 : 25;
  const rightX = isLandscape ? 200 : 135;

  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  // Left Signer
  doc.text('Mengetahui / Memeriksa,', leftX, startY);
  doc.text(leftTitle, leftX, startY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(leftName || '-', leftX, startY + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${leftNip || '-'}`, leftX, startY + 28);

  // Right Signer (Kepala Sekolah)
  const kota = schoolConfig.kota || 'Cikadu';
  doc.text(`${kota}, ${dateStr}`, rightX, startY);
  doc.text('Kepala Sekolah,', rightX, startY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolConfig.namaKepsek || '-', rightX, startY + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${schoolConfig.nipKepsek || '-'}`, rightX, startY + 28);
}

/**
 * 1. LAPORAN PRESENSI HARIAN SISWA (PDF)
 */
export function generateDailyAttendancePdf(
  records: AttendanceRecord[],
  tanggal: string,
  schoolConfig: SchoolConfig,
  kelasFilter = 'Semua'
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const filtered = kelasFilter === 'Semua' 
    ? records 
    : records.filter((r) => r.kelas === kelasFilter);

  // KOP SURAT
  let y = drawOfficialKop(doc, schoolConfig, false);

  // TITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN DAFTAR HADIR HARIAN SISWA', 105, y, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Tanggal: ${tanggal}   |   Rombel / Kelas: ${kelasFilter}   |   Total Hadir: ${filtered.length} Siswa`, 105, y + 5, { align: 'center' });

  y += 12;

  // TABLE HEADER
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, y, 180, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('NO', 18, y + 5.5);
  doc.text('WAKTU', 28, y + 5.5);
  doc.text('NISN', 46, y + 5.5);
  doc.text('NAMA SISWA', 70, y + 5.5);
  doc.text('KELAS', 125, y + 5.5);
  doc.text('SESI', 140, y + 5.5);
  doc.text('STATUS', 158, y + 5.5);
  doc.text('KET', 178, y + 5.5);

  y += 8;
  doc.setFont('helvetica', 'normal');

  if (filtered.length === 0) {
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 8, 195, y + 8);
    doc.setTextColor(100, 116, 139);
    doc.text('Belum ada rekaman presensi pada tanggal dan kelas yang dipilih.', 105, y + 5.5, { align: 'center' });
    y += 10;
  } else {
    filtered.forEach((r, idx) => {
      if (y > 255) {
        doc.addPage();
        y = 20;
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(15, y + 6, 195, y + 6);

      doc.setTextColor(15, 23, 42);
      doc.text(String(idx + 1), 18, y + 4.5);
      doc.text(r.waktu ? r.waktu.substring(0, 5) : '-', 28, y + 4.5);
      doc.text(r.nisn, 46, y + 4.5);
      doc.text(r.nama.length > 28 ? r.nama.substring(0, 26) + '...' : r.nama, 70, y + 4.5);
      doc.text(r.kelas, 126, y + 4.5);
      doc.text(r.sesi, 140, y + 4.5);

      // Color code status text
      if (r.status === 'Terlambat') {
        doc.setTextColor(194, 65, 12);
      } else if (r.status === 'Hadir') {
        doc.setTextColor(21, 128, 61);
      } else {
        doc.setTextColor(71, 85, 105);
      }
      doc.text(r.status, 158, y + 4.5);
      doc.setTextColor(15, 23, 42);

      const note = r.catatan ? (r.catatan.length > 14 ? r.catatan.substring(0, 12) + '..' : r.catatan) : '-';
      doc.text(note, 178, y + 4.5);
      y += 6.5;
    });
  }

  // SIGNATURE BLOCK
  if (y > 230) {
    doc.addPage();
    y = 25;
  } else {
    y += 12;
  }

  drawSignatures(doc, y, schoolConfig, 'Petugas Guru Piket,', schoolConfig.namaPetugasPiket, schoolConfig.nipPetugasPiket, false);

  doc.save(`Laporan_Presensi_${tanggal}_${kelasFilter}.pdf`);
}

/**
 * 2. REKAPITULASI PRESENSI APEL PAGI & SIANG (PDF)
 */
export function generateApelRecapPdf(
  students: Student[],
  records: AttendanceRecord[],
  sessionFilter: string, // 'Semua' | 'Pagi' | 'Siang'
  bulanNama: string,
  tahun: number,
  totalHeb: number,
  schoolConfig: SchoolConfig,
  kelasFilter = 'Semua'
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const filteredStudents = kelasFilter === 'Semua'
    ? students
    : students.filter((s) => s.kelas === kelasFilter);

  const monthIdxMap: Record<string, string> = {
    januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
    juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12'
  };
  const mm = bulanNama ? monthIdxMap[bulanNama.toLowerCase()] : '';
  const monthPrefix = mm ? `${tahun}-${mm}` : (tahun ? `${tahun}` : '');

  // Filter records: strictly APEL and within month/year
  const apelRecords = records.filter((r) => {
    const isApel = r.kategori === 'APEL' || (!r.kategori && !r.id.startsWith('PRESENSI_KBM_') && !r.mapel);
    if (!isApel) return false;
    if (monthPrefix && !r.tanggal.startsWith(monthPrefix)) return false;
    if (sessionFilter !== 'Semua' && r.sesi !== sessionFilter) return false;
    return true;
  });

  let y = drawOfficialKop(doc, schoolConfig, false);

  // TITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const sessionTitle = sessionFilter === 'Semua' ? 'APEL PAGI & KEPULANGAN SIANG' : `APEL ${sessionFilter.toUpperCase()}`;
  doc.text(`REKAPITULASI PRESENSI ${sessionTitle}`, 105, y, { align: 'center' });

  const targetPresensi = sessionFilter === 'Semua' ? totalHeb * 2 : totalHeb;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode: ${bulanNama.toUpperCase()} ${tahun}   |   Target HEB: ${totalHeb} Hari (${targetPresensi} Sesi)   |   Rombel: ${kelasFilter}`, 105, y + 5, { align: 'center' });

  y += 11;

  // TABLE HEADER
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, y, 180, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text('NO', 17, y + 5.5);
  doc.text('NISN', 25, y + 5.5);
  doc.text('NAMA SISWA', 46, y + 5.5);
  doc.text('L/P', 98, y + 5.5);
  doc.text('KLS', 106, y + 5.5);
  doc.text('PAGI (H/T)', 116, y + 5.5);
  doc.text('SIANG', 136, y + 5.5);
  doc.text('S', 148, y + 5.5);
  doc.text('I', 155, y + 5.5);
  doc.text('A', 162, y + 5.5);
  doc.text('TOTAL', 170, y + 5.5);
  doc.text('%', 186, y + 5.5);

  y += 8;
  doc.setFont('helvetica', 'normal');

  if (filteredStudents.length === 0) {
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 8, 195, y + 8);
    doc.setTextColor(100, 116, 139);
    doc.text('Tidak ada data siswa pada kelas yang dipilih.', 105, y + 5.5, { align: 'center' });
    y += 10;
  } else {
    filteredStudents.forEach((s, idx) => {
      if (y > 255) {
        doc.addPage();
        y = 20;
      }

      const sRecords = apelRecords.filter((r) => r.nisn === s.nisn);
      const pagiH = sRecords.filter((r) => r.sesi === 'Pagi' && r.status === 'Hadir').length;
      const pagiT = sRecords.filter((r) => r.sesi === 'Pagi' && r.status === 'Terlambat').length;
      const siangH = sRecords.filter((r) => r.sesi === 'Siang' && r.status === 'Hadir').length;

      const sakit = sRecords.filter((r) => r.status === 'Sakit').length;
      const izin = sRecords.filter((r) => r.status === 'Izin').length;
      const alpa = sRecords.filter((r) => r.status === 'Alpa').length;

      const totalHadirApel = pagiH + pagiT + siangH;
      const persentase = targetPresensi > 0 ? Math.min(100, Math.round((totalHadirApel / targetPresensi) * 100)) : 0;

      doc.setDrawColor(226, 232, 240);
      doc.line(15, y + 5.5, 195, y + 5.5);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      doc.text(String(idx + 1), 17, y + 4.2);
      doc.text(s.nisn, 25, y + 4.2);
      doc.text(s.nama.length > 25 ? s.nama.substring(0, 23) + '..' : s.nama, 46, y + 4.2);
      doc.text(s.jk, 99, y + 4.2);
      doc.text(s.kelas, 107, y + 4.2);

      // Pagi
      doc.text(`${pagiH}/${pagiT}`, 118, y + 4.2);
      // Siang
      doc.text(String(siangH), 138, y + 4.2);
      // S / I / A
      doc.text(String(sakit), 149, y + 4.2);
      doc.text(String(izin), 156, y + 4.2);
      doc.text(String(alpa), 163, y + 4.2);
      doc.text(String(totalHadirApel), 172, y + 4.2);

      if (persentase >= 85) {
        doc.setTextColor(21, 128, 61);
      } else {
        doc.setTextColor(185, 28, 28);
      }
      doc.text(`${persentase}%`, 185, y + 4.2);
      doc.setTextColor(15, 23, 42);

      y += 5.8;
    });
  }

  // SIGNATURE BLOCK
  if (y > 230) {
    doc.addPage();
    y = 25;
  } else {
    y += 12;
  }

  drawSignatures(doc, y, schoolConfig, 'Petugas Guru Piket,', schoolConfig.namaPetugasPiket, schoolConfig.nipPetugasPiket, false);

  doc.save(`Rekap_Absensi_Apel_${bulanNama}_${tahun}_${kelasFilter}.pdf`);
}

/**
 * 2B. REKAPITULASI PRESENSI PEMBELAJARAN (KBM GURU) (PDF)
 */
export function generateLearningRecapPdf(
  students: Student[],
  records: AttendanceRecord[],
  journals: TeachingJournal[],
  mapelFilter: string,
  guruName: string,
  kelasFilter: string,
  bulanNama: string,
  tahun: number,
  schoolConfig: SchoolConfig
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const filteredStudents = kelasFilter === 'Semua'
    ? students
    : students.filter((s) => s.kelas === kelasFilter);

  const monthIdxMap: Record<string, string> = {
    januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
    juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12'
  };
  const mm = bulanNama ? monthIdxMap[bulanNama.toLowerCase()] : '';
  const monthPrefix = mm ? `${tahun}-${mm}` : (tahun ? `${tahun}` : '');

  // Filter journals for KBM
  const filteredJournals = journals.filter((j) => {
    if (monthPrefix && !j.tanggal.startsWith(monthPrefix)) return false;
    if (mapelFilter !== 'Semua' && j.mapel.toLowerCase() !== mapelFilter.toLowerCase()) return false;
    if (guruName !== 'Semua' && j.guruNama !== guruName && j.guruId !== guruName) return false;
    if (kelasFilter !== 'Semua' && j.kelas !== kelasFilter) return false;
    return true;
  });

  // Filter records: strictly KELAS / PEMBELAJARAN
  const classRecords = records.filter((r) => {
    const isKbm = r.kategori === 'KELAS' || r.kategori === 'PEMBELAJARAN' || r.id.startsWith('PRESENSI_KBM_') || !!r.mapel;
    if (!isKbm) return false;
    if (monthPrefix && !r.tanggal.startsWith(monthPrefix)) return false;
    if (mapelFilter !== 'Semua' && r.mapel?.toLowerCase() !== mapelFilter.toLowerCase()) return false;
    if (kelasFilter !== 'Semua' && r.kelas !== kelasFilter) return false;
    return true;
  });

  const totalPertemuan = filteredJournals.length;

  let y = drawOfficialKop(doc, schoolConfig, false);

  // TITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('REKAPITULASI PRESENSI PEMBELAJARAN (KBM)', 105, y, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Mapel: ${mapelFilter}   |   Guru: ${guruName}   |   Kelas: ${kelasFilter}   |   Total TM: ${totalPertemuan} Pertemuan`,
    105,
    y + 5,
    { align: 'center' }
  );

  y += 11;

  // TABLE HEADER
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, y, 180, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('NO', 17, y + 5.5);
  doc.text('NISN', 26, y + 5.5);
  doc.text('NAMA SISWA', 48, y + 5.5);
  doc.text('L/P', 105, y + 5.5);
  doc.text('KLS', 114, y + 5.5);
  doc.text('H', 125, y + 5.5);
  doc.text('T', 133, y + 5.5);
  doc.text('S', 141, y + 5.5);
  doc.text('I', 149, y + 5.5);
  doc.text('A', 157, y + 5.5);
  doc.text('TOTAL', 165, y + 5.5);
  doc.text('% KBM', 180, y + 5.5);

  y += 8;
  doc.setFont('helvetica', 'normal');

  if (filteredStudents.length === 0) {
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 8, 195, y + 8);
    doc.setTextColor(100, 116, 139);
    doc.text('Tidak ada data siswa pada kelas yang dipilih.', 105, y + 5.5, { align: 'center' });
    y += 10;
  } else {
    filteredStudents.forEach((s, idx) => {
      if (y > 255) {
        doc.addPage();
        y = 20;
      }

      const sRecords = classRecords.filter((r) => r.nisn === s.nisn);
      const hadir = sRecords.filter((r) => r.status === 'Hadir').length;
      const terlambat = sRecords.filter((r) => r.status === 'Terlambat').length;
      const sakit = sRecords.filter((r) => r.status === 'Sakit').length;
      const izin = sRecords.filter((r) => r.status === 'Izin').length;
      const alpa = sRecords.filter((r) => r.status === 'Alpa').length;

      const totalHadir = hadir + terlambat;
      const persentase = totalPertemuan > 0 
        ? Math.min(100, Math.round((totalHadir / totalPertemuan) * 100))
        : (sRecords.length > 0 ? Math.min(100, Math.round((totalHadir / sRecords.length) * 100)) : 100);

      doc.setDrawColor(226, 232, 240);
      doc.line(15, y + 5.5, 195, y + 5.5);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      doc.text(String(idx + 1), 17, y + 4.2);
      doc.text(s.nisn, 26, y + 4.2);
      doc.text(s.nama.length > 27 ? s.nama.substring(0, 25) + '..' : s.nama, 48, y + 4.2);
      doc.text(s.jk, 106, y + 4.2);
      doc.text(s.kelas, 114, y + 4.2);
      doc.text(String(hadir), 125, y + 4.2);
      doc.text(String(terlambat), 133, y + 4.2);
      doc.text(String(sakit), 141, y + 4.2);
      doc.text(String(izin), 149, y + 4.2);
      doc.text(String(alpa), 157, y + 4.2);
      doc.text(String(totalHadir), 166, y + 4.2);

      if (persentase >= 85) {
        doc.setTextColor(21, 128, 61);
      } else {
        doc.setTextColor(185, 28, 28);
      }
      doc.text(`${persentase}%`, 182, y + 4.2);
      doc.setTextColor(15, 23, 42);

      y += 5.8;
    });
  }

  // SIGNATURE BLOCK
  if (y > 230) {
    doc.addPage();
    y = 25;
  } else {
    y += 12;
  }

  // Signer: Left is Guru Pengampu Mapel, Right is Kepala Sekolah
  const signerTitle = guruName !== 'Semua' ? `Guru Mata Pelajaran ${mapelFilter},` : 'Guru Pengampu,';
  drawSignatures(doc, y, schoolConfig, signerTitle, guruName !== 'Semua' ? guruName : 'Guru Mata Pelajaran', '-', false);

  const cleanMapel = mapelFilter.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Laporan_Rekap_KBM_${cleanMapel}_${kelasFilter}_${bulanNama}_${tahun}.pdf`);
}

/**
 * 2C. REKAPITULASI PRESENSI BULANAN (PDF LEGACY WRAPPER)
 */
export function generateMonthlyRecapPdf(
  students: Student[],
  records: AttendanceRecord[],
  bulanNama: string,
  tahun: number,
  totalHeb: number,
  schoolConfig: SchoolConfig,
  kelasFilter = 'Semua'
): void {
  generateApelRecapPdf(
    students,
    records,
    'Semua',
    bulanNama,
    tahun,
    totalHeb,
    schoolConfig,
    kelasFilter
  );
}

/**
 * 3. JURNAL MENGAJAR GURU (PDF LANDSCAPE)
 */
export function generateTeachingJournalsPdf(
  journals: TeachingJournal[],
  schoolConfig: SchoolConfig,
  filterGuru = 'Semua',
  filterKelas = 'Semua',
  filterMapel = 'Semua',
  bulanNama = '',
  tahun = new Date().getFullYear()
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const monthIdxMap: Record<string, string> = {
    januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
    juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12'
  };
  const mm = bulanNama ? monthIdxMap[bulanNama.toLowerCase()] : '';
  const monthPrefix = mm ? `${tahun}-${mm}` : (tahun ? `${tahun}` : '');

  const filtered = journals.filter((j) => {
    if (monthPrefix && !j.tanggal.startsWith(monthPrefix)) return false;
    const matchGuru = filterGuru === 'Semua' || j.guruNama === filterGuru || j.guruId === filterGuru;
    const matchKelas = filterKelas === 'Semua' || j.kelas === filterKelas;
    const matchMapel = filterMapel === 'Semua' || j.mapel.toLowerCase() === filterMapel.toLowerCase();
    return matchGuru && matchKelas && matchMapel;
  });

  let y = drawOfficialKop(doc, schoolConfig, true);

  // TITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('BUKU AGENDA & JURNAL KEGIATAN BELAJAR MENGAJAR (KBM) GURU', 148.5, y, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const periodeStr = bulanNama ? `${bulanNama.toUpperCase()} ${tahun}` : `TAHUN ${tahun}`;
  doc.text(`Periode: ${periodeStr}   |   Guru: ${filterGuru}   |   Mapel: ${filterMapel}   |   Kelas: ${filterKelas}   |   Total: ${filtered.length} Catatan Pertemuan`, 148.5, y + 5, { align: 'center' });

  y += 11;

  // TABLE HEADER (Landscape: Left margin 15, Width 267)
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 267, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, y, 267, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('NO', 17, y + 5.5);
  doc.text('TANGGAL & JAM', 26, y + 5.5);
  doc.text('GURU & MAPEL', 65, y + 5.5);
  doc.text('KLS / TM', 112, y + 5.5);
  doc.text('MATERI / TUJUAN PEMBELAJARAN', 135, y + 5.5);
  doc.text('PRESENSI (H/T/S/I/A)', 205, y + 5.5);
  doc.text('REFLEKSI KBM', 242, y + 5.5);

  y += 8;
  doc.setFont('helvetica', 'normal');

  if (filtered.length === 0) {
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 8, 282, y + 8);
    doc.setTextColor(100, 116, 139);
    doc.text('Belum ada catatan jurnal mengajar pada kriteria ini.', 148.5, y + 5.5, { align: 'center' });
    y += 10;
  } else {
    filtered.forEach((j, idx) => {
      if (y > 175) {
        doc.addPage();
        y = 20;
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(15, y + 7, 282, y + 7);

      doc.setTextColor(15, 23, 42);
      doc.text(String(idx + 1), 17, y + 4.5);
      doc.text(`${j.tanggal}\nJam: ${j.jamPelajaran || '-'}`, 26, y + 3.5);
      doc.text(`${j.guruNama.substring(0, 22)}\n${j.mapel}`, 65, y + 3.5);
      doc.text(`Kls ${j.kelas}\nTM ${j.pertemuanKe}`, 112, y + 3.5);

      const materi = j.materiPokok.length > 40 ? j.materiPokok.substring(0, 38) + '...' : j.materiPokok;
      doc.text(materi, 135, y + 4.5);

      const presensiStr = `H:${j.hadir} T:${j.terlambat} S:${j.sakit} I:${j.izin} A:${j.alpa}`;
      doc.text(presensiStr, 205, y + 3.5);
      doc.setFontSize(7.5);
      doc.setTextColor(21, 128, 61);
      doc.text(`(${j.persentaseKehadiran || 0}% Masuk)`, 205, y + 7);
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);

      const refleksi = j.catatanRefleksi ? (j.catatanRefleksi.length > 25 ? j.catatanRefleksi.substring(0, 23) + '..' : j.catatanRefleksi) : '-';
      doc.text(refleksi, 242, y + 4.5);

      y += 8.5;
    });
  }

  // SIGNATURE BLOCK
  if (y > 165) {
    doc.addPage();
    y = 20;
  } else {
    y += 10;
  }

  const signerName = filterGuru !== 'Semua' ? filterGuru : 'Guru Mata Pelajaran';
  drawSignatures(doc, y, schoolConfig, 'Guru Mata Pelajaran,', signerName, undefined, true);

  const cleanMapel = filterMapel !== 'Semua' ? `_${filterMapel.replace(/[^\w]/g, '_')}` : '';
  const cleanBulan = bulanNama ? `_${bulanNama}` : '';
  doc.save(`Buku_Agenda_Jurnal_KBM_${filterKelas}${cleanMapel}${cleanBulan}_${tahun}.pdf`);
}

/**
 * 4. DAFTAR NOMINATIF SISWA (PDF PORTRAIT)
 */
export function generateStudentListPdf(
  students: Student[],
  schoolConfig: SchoolConfig,
  filterKelas = 'Semua'
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const filtered = filterKelas === 'Semua'
    ? students
    : students.filter((s) => s.kelas === filterKelas);

  let y = drawOfficialKop(doc, schoolConfig, false);

  // TITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('DAFTAR NOMINATIF DATA POKOK SISWA', 105, y, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Rombel / Kelas: ${filterKelas}   |   Total Terdata: ${filtered.length} Siswa`, 105, y + 5, { align: 'center' });

  y += 11;

  // TABLE HEADER
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, y, 180, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('NO', 18, y + 5.5);
  doc.text('NISN', 28, y + 5.5);
  doc.text('NAMA LENGKAP SISWA', 58, y + 5.5);
  doc.text('L/P', 125, y + 5.5);
  doc.text('KELAS', 138, y + 5.5);
  doc.text('NO. HP / KONTAK ORTU', 154, y + 5.5);

  y += 8;
  doc.setFont('helvetica', 'normal');

  if (filtered.length === 0) {
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 8, 195, y + 8);
    doc.setTextColor(100, 116, 139);
    doc.text('Tidak ada siswa terdaftar pada kelas yang dipilih.', 105, y + 5.5, { align: 'center' });
    y += 10;
  } else {
    filtered.forEach((s, idx) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(15, y + 6, 195, y + 6);

      doc.setTextColor(15, 23, 42);
      doc.text(String(idx + 1), 18, y + 4.5);
      doc.text(s.nisn, 28, y + 4.5);
      doc.text(s.nama.length > 32 ? s.nama.substring(0, 30) + '..' : s.nama, 58, y + 4.5);
      doc.text(s.jk, 126, y + 4.5);
      doc.text(s.kelas, 140, y + 4.5);
      doc.text(s.nomorTeleponOrtu || '-', 154, y + 4.5);

      y += 6.5;
    });
  }

  // SIGNATURE BLOCK
  if (y > 230) {
    doc.addPage();
    y = 25;
  } else {
    y += 12;
  }

  drawSignatures(doc, y, schoolConfig, 'Pengelola Kesiswaan & IT,', schoolConfig.namaPetugasPiket, schoolConfig.nipPetugasPiket, false);

  doc.save(`Daftar_Siswa_${filterKelas}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * 5. LAPORAN KENDALI PANTAU SISWA UNTUK ORANG TUA (PDF PORTRAIT)
 */
export function generateStudentReportCardPdf(
  student: Student,
  records: AttendanceRecord[],
  schoolConfig: SchoolConfig
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const studentRecords = records.filter((r) => r.nisn === student.nisn);
  const hadir = studentRecords.filter((r) => r.status === 'Hadir').length;
  const terlambat = studentRecords.filter((r) => r.status === 'Terlambat').length;
  const sakit = studentRecords.filter((r) => r.status === 'Sakit').length;
  const izin = studentRecords.filter((r) => r.status === 'Izin').length;
  const alpa = studentRecords.filter((r) => r.status === 'Alpa').length;
  const totalMasuk = hadir + terlambat;
  const totalPertemuan = studentRecords.length;
  const persentase = totalPertemuan > 0 ? Math.round((totalMasuk / totalPertemuan) * 100) : 100;

  let y = drawOfficialKop(doc, schoolConfig, false);

  // TITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('LEMBAR KENDALI PRESTASI & KEHADIRAN SISWA', 105, y, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Laporan Digital Monitoring Orang Tua / Wali - Tahun Ajaran 2026/2027', 105, y + 5, { align: 'center' });

  y += 12;

  // STUDENT PROFILE BOX
  doc.setFillColor(248, 250, 252);
  doc.rect(15, y, 180, 26, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, y, 180, 26, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('IDENTITAS SISWA', 20, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Nama Lengkap   : ${student.nama}`, 20, y + 12);
  doc.text(`NISN / Induk    : ${student.nisn}`, 20, y + 17);
  doc.text(`Rombel / Kelas : Kelas ${student.kelas}`, 20, y + 22);

  doc.text(`Jenis Kelamin  : ${student.jk === 'L' ? 'Laki-Laki' : 'Perempuan'}`, 110, y + 12);
  doc.text(`No. WA Ortu    : ${student.nomorTeleponOrtu || '-'}`, 110, y + 17);
  doc.text(`Status Siswa   : Aktif Belajar`, 110, y + 22);

  y += 31;

  // ATTENDANCE STATS BADGES (6 columns)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('RINGKASAN KEHADIRAN SISWA', 15, y);
  y += 4;

  const colW = 28;
  const badges = [
    { label: 'HADIR', val: hadir, bg: [220, 252, 231], text: [21, 128, 61] },
    { label: 'TERLAMBAT', val: terlambat, bg: [254, 243, 199], text: [180, 83, 9] },
    { label: 'SAKIT', val: sakit, bg: [224, 242, 254], text: [3, 105, 161] },
    { label: 'IZIN', val: izin, bg: [243, 232, 255], text: [126, 34, 206] },
    { label: 'ALPA', val: alpa, bg: [254, 226, 226], text: [185, 28, 28] },
    { label: 'PERSENTASE', val: `${persentase}%`, bg: [238, 242, 255], text: [67, 56, 202] },
  ];

  badges.forEach((b, i) => {
    const x = 15 + i * (colW + 2);
    doc.setFillColor(b.bg[0], b.bg[1], b.bg[2]);
    doc.roundedRect(x, y, colW, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(b.label, x + colW / 2, y + 4.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(b.text[0], b.text[1], b.text[2]);
    doc.text(String(b.val), x + colW / 2, y + 11, { align: 'center' });
  });

  y += 20;

  // RECENT RECORDS TABLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('RIWAYAT PRESENSI & CATATAN TERKINI', 15, y);
  y += 4;

  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, y, 180, 7, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('NO', 18, y + 5);
  doc.text('TANGGAL', 28, y + 5);
  doc.text('WAKTU', 56, y + 5);
  doc.text('SESI', 80, y + 5);
  doc.text('STATUS', 110, y + 5);
  doc.text('CATATAN / KETERANGAN', 140, y + 5);

  y += 7;
  doc.setFont('helvetica', 'normal');

  const recent = studentRecords.slice(0, 15);
  if (recent.length === 0) {
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 7, 195, y + 7);
    doc.setTextColor(100, 116, 139);
    doc.text('Belum ada riwayat kehadiran tercatat.', 105, y + 5, { align: 'center' });
    y += 9;
  } else {
    recent.forEach((r, idx) => {
      doc.setDrawColor(226, 232, 240);
      doc.line(15, y + 6, 195, y + 6);
      doc.setTextColor(15, 23, 42);
      doc.text(String(idx + 1), 18, y + 4.2);
      doc.text(r.tanggal, 28, y + 4.2);
      doc.text(r.waktu ? r.waktu.substring(0, 5) : '-', 56, y + 4.2);
      doc.text(`Sesi ${r.sesi}`, 80, y + 4.2);

      if (r.status === 'Terlambat') doc.setTextColor(180, 83, 9);
      else if (r.status === 'Hadir') doc.setTextColor(21, 128, 61);
      else doc.setTextColor(185, 28, 28);

      doc.text(r.status, 110, y + 4.2);
      doc.setTextColor(15, 23, 42);

      const note = r.catatan ? (r.catatan.length > 25 ? r.catatan.substring(0, 23) + '..' : r.catatan) : '-';
      doc.text(note, 140, y + 4.2);

      y += 6;
    });
  }

  y += 10;
  // Signatures: Left Orang Tua, Right Wali Kelas
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Mengetahui / Memeriksa,', 25, y);
  doc.text('Orang Tua / Wali Siswa,', 25, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('( .................................................... )', 25, y + 24);

  const kota = schoolConfig.kota || 'Cikadu';
  doc.setFont('helvetica', 'normal');
  doc.text(`${kota}, ${dateStr}`, 135, y);
  doc.text('Wali Kelas / Petugas,', 135, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolConfig.namaPetugasPiket || 'Budi Santoso, S.Pd.', 135, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${schoolConfig.nipPetugasPiket || '-'}`, 135, y + 28);

  doc.save(`Laporan_Pantau_${student.nisn}_${student.nama.replace(/\s+/g, '_')}.pdf`);
}

/**
 * 6. DAFTAR TENAGA PENDIDIK & DISTRIBUSI BEBAN MENGAJAR (PDF)
 */
export function generateTeacherListPdf(
  teachers: TeacherUser[],
  schoolConfig: SchoolConfig
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let y = drawOfficialKop(doc, schoolConfig, false);

  // TITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('DAFTAR TENAGA PENDIDIK & DISTRIBUSI BEBAN MENGAJAR', 105, y, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Tahun Ajaran 2026/2027   |   Total Guru / Staf: ${teachers.length} Orang`, 105, y + 5, { align: 'center' });

  y += 12;

  // TABLE HEADER
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, y, 180, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('NO', 18, y + 5.5);
  doc.text('NAMA LENGKAP & NIP', 28, y + 5.5);
  doc.text('PENUGASAN MATA PELAJARAN', 86, y + 5.5);
  doc.text('BEBAN', 142, y + 5.5);
  doc.text('WALI', 158, y + 5.5);
  doc.text('PERAN', 174, y + 5.5);

  y += 8;
  doc.setFont('helvetica', 'normal');

  teachers.forEach((t, idx) => {
    if (y > 255) {
      doc.addPage();
      y = 20;
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 8, 195, y + 8);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(String(idx + 1), 18, y + 4.5);

    // Name & NIP
    doc.setFont('helvetica', 'bold');
    doc.text(t.nama.length > 28 ? t.nama.substring(0, 26) + '..' : t.nama, 28, y + 3.8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(t.nip ? `NIP. ${t.nip}` : 'NIP. -', 28, y + 7.2);
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    // Mapel
    const mapelList = t.penugasanMapel?.map((p) => `${p.mapel} (${p.kelas.join(',')})`).join(', ') || t.mapel || '-';
    doc.text(mapelList.length > 34 ? mapelList.substring(0, 32) + '..' : mapelList, 86, y + 5);

    // Beban Jam
    const sumJam = t.penugasanMapel?.reduce((acc, p) => acc + (p.bebanJam || 0), 0) || t.totalJamMengajar || 0;
    doc.text(`${sumJam} Jam`, 142, y + 5);

    // Wali Kelas
    doc.text(t.waliKelas ? `Kls ${t.waliKelas}` : '-', 158, y + 5);

    // Role
    const roleLabel = t.role === 'admin' ? 'Admin' : t.role === 'piket' ? 'Piket' : 'Guru';
    doc.text(roleLabel, 174, y + 5);

    y += 9;
  });

  if (y > 230) {
    doc.addPage();
    y = 25;
  } else {
    y += 12;
  }

  drawSignatures(doc, y, schoolConfig, 'Kepala Tata Usaha,', schoolConfig.namaPetugasPiket, schoolConfig.nipPetugasPiket, false);

  doc.save(`Data_Guru_${schoolConfig.namaSekolah.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * 7. KALENDER HARI EFEKTIF BELAJAR (HEB) (PDF)
 */
export function generateHebCalendarPdf(
  kalenderHeb: KalenderHeb,
  tahun: number,
  bulanIndex: number,
  schoolConfig: SchoolConfig
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const bulanNama = monthNames[bulanIndex];
  const daysInMonth = new Date(tahun, bulanIndex + 1, 0).getDate();

  let y = drawOfficialKop(doc, schoolConfig, false);

  // TITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('KALENDER PENDIDIKAN & HARI EFEKTIF BELAJAR (HEB)', 105, y, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  const kalMap = kalenderHeb.kalenderData || {};
  let totalHeb = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const k = `${tahun}-${String(bulanIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (kalMap[k] !== false) totalHeb++;
  }

  doc.text(`Bulan: ${bulanNama} ${tahun}   |   Target HEB: ${totalHeb} Hari   |   Sistem: ${schoolConfig.sistemHariSekolah === '5_HARI' ? '5 Hari' : '6 Hari'} Sekolah`, 105, y + 5, { align: 'center' });

  y += 12;

  // TABLE HEADER
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, y, 180, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('TANGGAL', 20, y + 5.5);
  doc.text('HARI', 55, y + 5.5);
  doc.text('STATUS HARI SEKOLAH', 95, y + 5.5);
  doc.text('KETERANGAN', 145, y + 5.5);

  y += 8;
  doc.setFont('helvetica', 'normal');

  const dayLabels = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  for (let d = 1; d <= daysInMonth; d++) {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }

    const dateObj = new Date(tahun, bulanIndex, d);
    const dayOfWeek = dateObj.getDay();
    const dateKey = `${tahun}-${String(bulanIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isEffective = kalMap[dateKey] !== false;

    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 6, 195, y + 6);

    doc.setTextColor(15, 23, 42);
    doc.text(`${d} ${bulanNama} ${tahun}`, 20, y + 4.5);
    doc.text(dayLabels[dayOfWeek], 55, y + 4.5);

    if (isEffective) {
      doc.setTextColor(21, 128, 61);
      doc.text('Hari Efektif Belajar (HEB)', 95, y + 4.5);
      doc.setTextColor(71, 85, 105);
      doc.text('KBM & Presensi Aktif', 145, y + 4.5);
    } else {
      doc.setTextColor(225, 29, 72);
      doc.text('Libur / Non-Efektif', 95, y + 4.5);
      doc.setTextColor(100, 116, 139);
      doc.text(dayOfWeek === 0 ? 'Libur Akhir Pekan (Minggu)' : dayOfWeek === 6 && schoolConfig.sistemHariSekolah === '5_HARI' ? 'Libur Sabtu (Sistem 5 Hari)' : 'Hari Libur / Agenda Khusus', 145, y + 4.5);
    }

    y += 6.5;
  }

  if (y > 230) {
    doc.addPage();
    y = 25;
  } else {
    y += 12;
  }

  drawSignatures(doc, y, schoolConfig, 'Koordinator Kurikulum & HEB,', schoolConfig.namaPetugasPiket, schoolConfig.nipPetugasPiket, false);

  doc.save(`Kalender_HEB_${bulanNama}_${tahun}_${schoolConfig.namaSekolah.replace(/\s+/g, '_')}.pdf`);
}

/**
 * 8. CETAK BERKAS PDF KARTU TANDA SISWA (F4 / A4 SIAP GUNTING)
 */
export async function generateStudentIdCardsPdf(
  students: Student[],
  schoolConfig: SchoolConfig,
  format: 'A4' | 'F4' = 'F4'
): Promise<void> {
  const isF4 = format === 'F4';
  const pageHeight = isF4 ? 330 : 297;
  const pageWidth = 210;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isF4 ? [210, 330] : 'a4',
  });

  // Card dimensions: 86mm x 54mm (standard ISO/ID-1)
  const cardW = 86;
  const cardH = 54;
  const startX = 14;
  const startY = 16;
  const gapX = 10;
  const gapY = 8;
  const cardsPerRow = 2;
  const cardsPerCol = isF4 ? 5 : 4;
  const cardsPerPage = cardsPerRow * cardsPerCol;

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const pageIndex = Math.floor(i / cardsPerPage);
    const indexInPage = i % cardsPerPage;

    if (i > 0 && indexInPage === 0) {
      doc.addPage();
    }

    const col = indexInPage % cardsPerRow;
    const row = Math.floor(indexInPage / cardsPerRow);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    // Outer Cut Border
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.rect(x, y, cardW, cardH, 'S');

    // Header Stripe (Navy Blue)
    doc.setFillColor(30, 58, 138);
    doc.rect(x, y, cardW, 13, 'F');

    // School Logo in card header
    const logoData = schoolConfig.logoUrl || SCHOOL_LOGO_PNG_DATA_URL;
    if (logoData) {
      try {
        doc.addImage(logoData, 'PNG', x + 2, y + 1.5, 10, 10);
      } catch {
        // ignore
      }
    }

    // Card Header Text
    doc.setTextColor(253, 224, 71); // Amber
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('KARTU TANDA SISWA', x + 14, y + 4.5);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.text(schoolConfig.namaSekolah || 'SMP PGRI 1 CIKADU', x + 14, y + 7.5);

    doc.setTextColor(224, 231, 255);
    doc.setFontSize(5);
    doc.text(`NPSN: ${schoolConfig.npsn || '20252876'} • TA 2026/2027`, x + 14, y + 10.5);

    // Card Body: Student Details
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const displayName = s.nama.length > 22 ? s.nama.substring(0, 20) + '..' : s.nama;
    doc.text(displayName, x + 4, y + 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`NISN  : ${s.nisn}`, x + 4, y + 26);
    doc.text(`Kelas : ${s.kelas} (${s.jk === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'})`, x + 4, y + 31);
    doc.text(`Status: SISWA AKTIF`, x + 4, y + 36);

    // Footer Card Text
    doc.setFontSize(4.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`${schoolConfig.kota || 'Cikadu'}, Kab. Cianjur - Jawa Barat`, x + 4, y + 49);

    // QR Code on right side of card
    try {
      const qrDataUrl = await generateQrDataUrl(s.nisn);
      if (qrDataUrl) {
        doc.setFillColor(255, 255, 255);
        doc.rect(x + 55, y + 17, 27, 27, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(x + 55, y + 17, 27, 27, 'S');
        doc.addImage(qrDataUrl, 'PNG', x + 56, y + 18, 25, 25);
      }
    } catch {
      // skip qr if failed
    }
  }

  doc.save(`Kartu_Siswa_${format}_${schoolConfig.namaSekolah.replace(/\s+/g, '_')}.pdf`);
}
