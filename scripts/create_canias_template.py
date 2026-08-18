from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

OUTPUT = Path('/home/ubuntu/SESA-DASH/database/canias-data-entry-template.xlsx')
SHEETS = [
    ('Departments', 'Departmanlar / İş Merkezleri', ['id', 'canias_work_center_code', 'canias_department_code', 'name', 'is_active'], ['Canias İş Merkezi Kodu', 'Canias İş Merkezi Kodu', 'Canias Departman Kodu', 'İş merkezi/departman adı', '1 aktif / 0 pasif']),
    ('Users', 'Kullanıcılar / Personel', ['personnel_no', 'full_name', 'email', 'role', 'firebase_uid', 'is_active'], ['Canias Personel Sicil No', 'Ad Soyad', 'Kurumsal e-posta', 'admin / operator / maintenance / sorumlu', 'Firebase Auth UID; ilk aktarımda boş olabilir', '1 aktif / 0 pasif']),
    ('UserDepartments', 'Personel – İş Merkezi Yetkileri', ['personnel_no', 'department_id'], ['Canias Personel Sicil No', 'İş Merkezi Kodu']),
    ('Machines', 'Makineler', ['code', 'name', 'department_id', 'qr_code_value', 'canias_asset_no', 'is_active'], ['Canias Makine Kodu', 'Makine adı/modeli', 'İş Merkezi Kodu', 'QR değeri veya URL', 'Canias demirbaş/varlık no; yoksa boş', '1 aktif / 0 pasif']),
    ('Issues', 'Arıza / Bakım Kayıtları', ['machine_code', 'reporter_personnel_no', 'malfunction_type', 'priority', 'description', 'status', 'created_at'], ['Canias Makine Kodu', 'Bildiren Personel Sicil No', 'Arıza veya bakım türü', 'low / normal / high / critical', 'Arıza açıklaması', 'Açık / İşlemde / Çözüldü', 'UTC tarih-saat']),
    ('IssueStatusHistory', 'Arıza Durum Geçmişi', ['issue_id', 'status', 'changed_by_user_id', 'changed_at'], ['Sistemde oluşan arıza ID', 'Açık / İşlemde / Çözüldü', 'Değişikliği yapan kullanıcı ID', 'UTC tarih-saat']),
]

wb = Workbook()
wb.remove(wb.active)
for sheet_name, title, headers, notes in SHEETS:
    ws = wb.create_sheet(sheet_name)
    ws.append([title])
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(headers))
    ws['A1'].font = Font(bold=True, color='FFFFFF', size=14)
    ws['A1'].fill = PatternFill('solid', fgColor='123B5D')
    ws.append(headers)
    for cell in ws[2]:
        cell.font = Font(bold=True, color='FFFFFF')
        cell.fill = PatternFill('solid', fgColor='1D6A96')
    ws.append(notes)
    for cell in ws[3]:
        cell.font = Font(italic=True, color='555555')
        cell.alignment = Alignment(wrap_text=True, vertical='top')
    ws.freeze_panes = 'A3'
    ws.auto_filter.ref = f'A2:{get_column_letter(len(headers))}2'
    ws.row_dimensions[3].height = 38
    for idx, header in enumerate(headers, 1):
        ws.column_dimensions[get_column_letter(idx)].width = max(18, min(34, len(header) + 8))
    for row in ws.iter_rows(min_row=4, max_row=103, min_col=1, max_col=len(headers)):
        for cell in row:
            cell.number_format = '@'
    if 'role' in headers:
        col = get_column_letter(headers.index('role') + 1)
        validation = DataValidation(type='list', formula1='"admin,operator,maintenance,sorumlu"', allow_blank=True)
        ws.add_data_validation(validation)
        validation.add(f'{col}4:{col}103')
    if 'priority' in headers:
        col = get_column_letter(headers.index('priority') + 1)
        validation = DataValidation(type='list', formula1='"low,normal,high,critical"', allow_blank=True)
        ws.add_data_validation(validation)
        validation.add(f'{col}4:{col}103')
    if 'status' in headers:
        col = get_column_letter(headers.index('status') + 1)
        validation = DataValidation(type='list', formula1='"Açık,İşlemde,Çözüldü"', allow_blank=True)
        ws.add_data_validation(validation)
        validation.add(f'{col}4:{col}103')

wb.properties.title = 'SESA-DASH CaniasERP Veri Giriş Şablonu'
wb.properties.creator = 'SESA-DASH'
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
wb.save(OUTPUT)
print(OUTPUT)
