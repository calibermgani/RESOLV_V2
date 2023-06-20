import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { DatePipe } from '@angular/common';
// import { Workbook } from 'exceljs';
// import * as fs from 'file-saver';
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';
@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  constructor(private datePipe: DatePipe) {  }
  public exportAsExcelFile(json: any[], excelFileName: string): void {

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);

    const title = 'Car Sell Report';

    //let titleRow = worksheet.addRow([title]);
    //titleRow.font = { name: 'Comic Sans MS', family: 4, size: 16, underline: 'double', bold: true };

   // worksheet.addRow([]);

     this.wrapAndCenterCell(worksheet['B2']);
    // console.log('worksheet',worksheet);
    console.log(excelFileName);
    if(excelFileName == 'Followup- Assigned_claims'){
      const workbook: XLSX.WorkBook = { Sheets: { 'Followup- Assigned claims': worksheet }, SheetNames: ['Followup- Assigned claims'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      //const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      this.saveAsExcelFile(excelBuffer, excelFileName);
    }else if(excelFileName == 'Followup- Reassigned_claims'){
      const workbook: XLSX.WorkBook = { Sheets: { 'Followup- Reassigned Claims': worksheet }, SheetNames: ['Followup- Reassigned Claims'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      //const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      this.saveAsExcelFile(excelBuffer, excelFileName);
    }else if(excelFileName == 'Followup- Closed_claims'){
      const workbook: XLSX.WorkBook = { Sheets: { 'Followup- Closed Claims': worksheet }, SheetNames: ['Followup- Closed Claims'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      //const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      this.saveAsExcelFile(excelBuffer, excelFileName);
    }else if(excelFileName == 'Claims-Create_work_order_claims'){
      const workbook: XLSX.WorkBook = { Sheets: { 'Claims- Create Work Order': worksheet }, SheetNames: ['Claims- Create Work Order'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      //const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      this.saveAsExcelFile(excelBuffer, excelFileName);
    }else if(excelFileName == 'Claims-Closed_claims'){
      const workbook: XLSX.WorkBook = { Sheets: { 'Claims- Closed Claims': worksheet }, SheetNames: ['Claims- Closed Claims'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      //const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      this.saveAsExcelFile(excelBuffer, excelFileName);
    }else if(excelFileName == 'Closed_claims'){
      const workbook: XLSX.WorkBook = { Sheets: { 'Closed Claims': worksheet }, SheetNames: ['Closed Claims'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      //const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      this.saveAsExcelFile(excelBuffer, excelFileName);
    }else if(excelFileName == 'Billing_claims'){
      const workbook: XLSX.WorkBook = { Sheets: { 'Billing Claims': worksheet }, SheetNames: ['Billing Claims'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      //const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      this.saveAsExcelFile(excelBuffer, excelFileName);
    }else if(excelFileName == 'Client_assistance_claims'){
      const workbook: XLSX.WorkBook = { Sheets: { 'Client Assistance Claims': worksheet }, SheetNames: ['Client Assistance Claims'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      //const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      this.saveAsExcelFile(excelBuffer, excelFileName);
    }else if(excelFileName == 'Audit- Audit_que_claims'){
      const workbook: XLSX.WorkBook = { Sheets: { 'Audit- Audit Que Claims': worksheet }, SheetNames: ['Audit- Audit Que Claims'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      //const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      this.saveAsExcelFile(excelBuffer, excelFileName);
    }else if(excelFileName == 'Audit_work_order_claims'){
      const workbook: XLSX.WorkBook = { Sheets: { 'Audit- Work Order Claims': worksheet }, SheetNames: ['Audit- Work Order Claims'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      //const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      this.saveAsExcelFile(excelBuffer, excelFileName);
    }else if(excelFileName == 'Audit- Closed_claims'){
      const workbook: XLSX.WorkBook = { Sheets: { 'Audit- Closed Claims': worksheet }, SheetNames: ['Audit- Closed Claims'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      //const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      this.saveAsExcelFile(excelBuffer, excelFileName);
    }else if(excelFileName == 'Audit- Assigned_claims'){
      const workbook: XLSX.WorkBook = { Sheets: { 'Audit- Assigned Claims': worksheet }, SheetNames: ['Audit- Assigned Claims'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      //const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      this.saveAsExcelFile(excelBuffer, excelFileName);
    }else if(excelFileName == 'Work_order_claims'){
      const workbook: XLSX.WorkBook = { Sheets: { 'Claims- Work Order Claims': worksheet }, SheetNames: ['Claims- Work Order Claims'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      //const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      this.saveAsExcelFile(excelBuffer, excelFileName);
    }else if(excelFileName == 'Report_claims'){
      const workbook: XLSX.WorkBook = { Sheets: { 'Report Claims': worksheet }, SheetNames: ['Report Claims'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      //const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      this.saveAsExcelFile(excelBuffer, excelFileName);
    }if(excelFileName == 'template'){
      const workbook: XLSX.WorkBook = { Sheets: { 'Template': worksheet }, SheetNames: ['Template'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      //const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      this.saveAsExcelFile(excelBuffer, excelFileName);
    }
  }
  private wrapAndCenterCell(cell: XLSX.CellObject) {
    const wrapAndCenterCellStyle = { alignment: { wrapText: true, vertical: 'center', horizontal: 'center' } };
    this.setCellStyle(cell, wrapAndCenterCellStyle);
  }
  private setCellStyle(cell: XLSX.CellObject, style: {}) {
    cell.s = style;

    // cell.s.Style.Font.Bold = true;

  }
  private saveAsExcelFile(buffer: any, fileName: string): void {
    console.log(fileName);
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE
    });

    var date = new Date();
    var date_format =  this.datePipe.transform(date,"MM-dd-yyyy");

    FileSaver.saveAs(data, fileName + '_' + date_format);
  }
}
