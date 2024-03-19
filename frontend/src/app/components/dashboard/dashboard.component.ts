import { Component, OnInit, ViewEncapsulation, NgZone } from '@angular/core';
import { SetUserService } from '../../Services/set-user.service';
import { NotifyService } from '../../Services/notify.service';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { ReportService } from 'src/app/Services/report.service';
import { ColDef, GridOptions } from 'ag-grid-community';
// import { s } from '@angular/core/src/render3';
import { AuthService } from 'src/app/Services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit {

      public practiceLogIn !:boolean;
      public monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      public thisMonth = this.monthNames[(new Date()).getMonth()];
      public prevMonth = this.monthNames[(new Date()).getMonth() - 1];

      public payer_classfication:any= [];
      public agingBucket:any = [];
      public touch:any=[];
      public status_code:any= [];
      public statusFooter:any=[];
      public performance:any=[];
      public day30:any = [] ;
      public day60:any = [];
      public day90: any = [];
      public day120!: any[];
      public day180!: any[];
      public day365: any = [];
      public day366: any = [];

      public janless3: any = [];
      public janthree: any = [];
      public janfour: any = [];
      public janfive: any = [];
      public jansix: any = [];
      public jansixplus: any = [];

      public febless3: any = [];
      public febthree: any = [];
      public febfour: any = [];
      public febfive: any = [];
      public febsix: any = [];
      public febsixplus: any = [];

      public marless3: any = [];
      public marthree: any = [];
      public marfour: any = [];
      public marfive: any = [];
      public marsix: any = [];
      public marsixplus: any = [];

      public aprless3: any = [];
      public aprthree: any = [];
      public aprfour: any = [];
      public aprfive: any = [];
      public aprsix: any = [];
      public aprsixplus: any = [];

      public mayless3: any = [];
      public maythree: any = [];
      public mayfour: any = [];
      public mayfive: any = [];
      public maysix: any = [];
      public maysixplus: any = [];

      public juneless3: any = [];
      public junethree: any = [];
      public junefour: any = [];
      public junefive: any = [];
      public junesix: any = [];
      public junesixplus: any = [];

      public julyless3: any = [];
      public julythree: any = [];
      public julyfour: any = [];
      public julyfive: any = [];
      public julysix: any = [];
      public julysixplus: any = [];

      public augless3: any = [];
      public augthree: any = [];
      public augfour: any = [];
      public augfive: any = [];
      public augsix: any = [];
      public augsixplus: any = [];

      public sepless3: any = [];
      public septhree: any = [];
      public sepfour: any = [];
      public sepfive: any = [];
      public sepsix: any = [];
      public sepsixplus: any = [];

      public octless3: any = [];
      public octthree: any = [];
      public octfour: any = [];
      public octfive: any = [];
      public octsix: any = [];
      public octsixplus: any = [];

      public novless3: any = [];
      public novthree: any = [];
      public novfour: any = [];
      public novfive: any = [];
      public novsix: any = [];
      public novsixplus: any = [];

      public decless3: any = [];
      public decthree: any = [];
      public decfour: any = [];
      public decfive: any = [];
      public decsix: any = [];
      public decsixplus: any = [];

      public name!:string;
      public total: any = [];
      public user:any;
      public pending: any = [];
      public assign: any = [];
      public worked!: any[];
      public resolved: any = [];

      pyramid!: Object;
      stacked!: object;
      dataSource!: object;
      pie3d!: object;
      stacked_chart!: object;
      data!: Object;
      dataset!: object;
      chartData :any=[];
      status_chart:any=[];
      associates_chart:any=[];
      associates_chart_pending:any=[];
      associates_chart_assign:any=[];
      associates_chart_worked:any=[];
      associates_chart_resolved:any=[];

      width = 600;
      height = 400;
      type = "line";
      dataFormat = "json";
      dataSource1= {
        chart: {
          caption: "ATB - Payer Classification",
          yaxisname: "Sum of Insurance Balance",
          subcaption: "Sum of Insurance Balance",
          theme: "candy"
        },
        data: [
          {
            label: "AETNA",
            value: "50875.58"
          },
          {
            label: "Assist Health Group",
            value: "13051"
          },
          {
            label: "BLUE CROSS BLUE SHIELD",
            value: "29888.7"
          },
          {
            label: "CIGNA HEALTHCARE",
            value: "315"
          },
          {
            label: "GUARANTEE TRUST LIFE",
            value: "250"
          },
          {
            label: "HEALTH ALLIANCE",
            value: "101708.98"
          },
          {
            label: "HUMANA",
            value: "27786.84"
          },
          {
            label: "IPA",
            value: "31827.48"
          },
          {
            label: "MEDICARE",
            value: "21205.44"
          },
          {
            label: "MEDI-SHARE",
            value: "532"
          },
          {
            label: "MERIDIAN HEALTH PLAN",
            value: "18326"
          },
          {
            label: "MOLINA IPA",
            value: "50753.78"
          },
          {
            label: "PHYSICIANS MUTUAL INS CO",
            value: "4802.14"
          },
          {
            label: "TRICARE EAST REGION",
            value: "1573.7"
          },
          {
            label: "UNITED HEALTH CARE",
            value: "28860.87"
          },
          {
            label: "WELLCARE",
            value: "33971.61"
          },
        ]
      };
      dataSource2 = {
        chart: {
          caption: "ATB - Touch Analysis",
          subcaption: "Claims Touches",
          showvalues: "1",
          showpercentintooltip: "0",
          // numberprefix: "$",
          enablemultislicing: "1",
          theme: "gammel"
        },
        data: [
          {
            label: "1-Touch",
            value: "552"
          },
          {
            label: "2-Touch",
            value: "497"
          },
          {
            label: "3-Touch",
            value: "372"
          },
          {
            label: "4-Touch",
            value: "176"
          },
          // {
          //   label: "Insurance",
          //   value: "20000"
          // }
        ]
      };
      dataSource3 = {
        chart: {
          caption: "ATB - Status Code",
          subcaption: "MTD",
          pyaxisname: "Amount",
          theme: "gammel",
          showsecondarylimits: "0",
          numberprefix: "$",
          showdivlinesecondaryvalue: "0",
          plottooltext:
            "Due to $label, late arrivals count is : <b>$dataValue</b> of the total <b>$sum</b> employees",
          drawcrossline: "1"
        },
        data: [
          {
            label: "Approved To pay",
            value: "44.88"
          },
          {
            label: "Authorization",
            value: "2,445.57"
          },
          {
            label: "Claim not on File",
            value: "75.00"
          },
          {
            label: "Claim Paid",
            value: "4,728.88"
          },
          {
            label: "Claim Rejected as Missing/Invalid Information",
            value: "616.96"
          },
          {
            label: "Clearing House Rejection",
            value: "93.26"
          },
          {
            label: "Incorrectly Processed ",
            value: "403.04"
          },
          {
            label: "Missing Primary EOB",
            value: "1,892.27"
          },
          {
            label: "No Coverage",
            value: "849.50"
          },

          {
            label: "No Original Claim on File",
            value: "38.24"
          },
          {
            label: "Past Timely Filing",
            value: "6,801.84"
          },
          {
            label: "Primary/Secondary 11th Set",
            value: "3,447.47"
          },
          {
            label: "Primary/Secondary 12th Set",
            value: "10.00"
          },
          {
            label: "Past Timely Filing",
            value: "6,801.84"
          }
        ]
      }
      dataSource4 = {
        chart: {
          caption: "MTD - Associates Performance",
          subcaption: "Conversions as % of total",
          xaxisname: "# Conversions",
          yaxisname: "Cost Per Conversion",
          numberprefix: "$",
          theme: "gammel",
          plottooltext: "$name : Share of total conversion: $zvalue%"
        },
        categories: [
          {
            verticallinealpha: "20",
            category: [
              {
                label: "0",
                x: "0"
              },
              {
                label: "1500",
                x: "1500",
                showverticalline: "1"
              },
              {
                label: "3000",
                x: "3000",
                showverticalline: "1"
              },
              {
                label: "4500",
                x: "4500",
                showverticalline: "1"
              },
              {
                label: "6000",
                x: "6000",
                showverticalline: "1"
              }
            ]
          }
        ],
        dataset: [
          {
            data: [
              {
                x: "5540",
                y: "16.09",
                z: "30.63",
                name: "Campaign 1"
              },
              {
                x: "4406",
                y: "12.74",
                z: "24.36",
                name: "Campaign 2"
              },
              {
                x: "1079",
                y: "15.79",
                z: "5.97",
                name: "Campaign 3"
              },
              {
                x: "1700",
                y: "8.27",
                z: "9.4",
                name: "Campaign 4"
              },
              {
                x: "853",
                y: "15.89",
                z: "4.71",
                name: "Campaign 5"
              },
              {
                x: "1202",
                y: "10.74",
                z: "6.65",
                name: "Campaign 6"
              },
              {
                x: "2018",
                y: "6.14",
                z: "11.16",
                name: "Campaign 7"
              },
              {
                x: "413",
                y: "19.83",
                z: "2.28",
                name: "Campaign 8"
              },
              {
                x: "586",
                y: "13.96",
                z: "3.24",
                name: "Campaign 9"
              },
              {
                x: "184",
                y: "15.82",
                z: "1.02",
                name: "Campaign 10"
              },
              {
                x: "311",
                y: "5.83",
                z: "1.72",
                name: "Campaign 11"
              },
              {
                x: "35",
                y: "10.76",
                z: "0.19",
                name: "Campaign 12"
              },
              {
                x: "55",
                y: "2.73",
                z: "0.3",
                name: "Campaign 13"
              },
              {
                x: "6",
                y: "21.22",
                z: "0.03",
                name: "Campaign 14"
              }
            ]
          }
        ]
      };
      dataSource5 = {
        "chart": {
          "caption": "Client Assistance Report",
          "subCaption": "",
          // "xAxisName": "",
          "yAxisName": "Client Assitance",
          // "numberSuffix": "K",
          "theme": "gammel",
        },
        "data": [{
          "label": "Auth Assistance",
          "value": "3"
        }, {
          "label": "Patient Billing Assiatnce",
          "value": "2"
        }, {
          "label": "Adjustment Approval",
          "value": "1"
        }, {
          "label": "Rebilling Assitance",
          "value": "1"
        }, {
          "label": "Webportal Access",
          "value": "1"
        }, {
          "label": "Coding Assitance",
          "value": "1"
        }, {
          "label": "Medical Record Assistance",
          "value": "1"
        },]
      };

      // dataSource: Object;
      chartConfig: any;

      constructor(
        private setus: SetUserService,
      private notify_service:NotifyService,
      private modalService: NgbModal,
      private dataservice: ReportService, private zone: NgZone,
      private auth : AuthService
      )
      {

        this.chartConfig = {
          width: '770',
          height: '400',
          type: 'column2d',
          dataFormat: 'json',
      };

      this.dataSource = {
          "chart": {
            "caption": "ATB - Aging Analysis",
            "subCaption": "Sum of Insurance Balance",
            "xAxisName": "Aging",
            "yAxisName": "Sum of Insurance Balance",
            // "numberSuffix": "K",
            "theme": "gammel",
          },
          "data": [{
            "label": "120-180(15)",
            "value": "17154.03"
          }, {
            "label": "181-365(19)",
            "value": "34188.84"
          }, {
            "label": "31-60(168)",
            "value": "274716.41"
          }, {
            "label": "366+(9)",
            "value": "31640.6"
          }, {
            "label": "61-90(334)",
            "value": "38171.23"
          }, {
            "label": "91-120(9)",
            "value": "19858.01"
          },]
        };


        let id: number = 0;
        //  this.notify_service.get_notify_data().subscribe(message => { this.process_notify(message) });
        this.dataservice.getdata(id).subscribe(
        (data:any) => {
  		  console.log(data.data);
  		  console.log("sample -------------- data");
  		  console.log(data.data.aging_analysis);
       this.agingBucket.push(data.data.aging_analysis);
       for (const value of this.agingBucket) {
        this.day30 = value.day30;
        this.day60 =value.day60;
        this.day90 = value.day90;
        this.day120 = value.day120;
        this.day180= value.day180;
        this.day365 = value.day365;
        this.day366 = value.day366;
        }
        this.pyramid = {
          "chart": {
                  "captionOnTop": "0",
                  "captionPadding": "25",
                  "alignCaptionWithCanvas": "1",
                  "subCaptionFontSize": "12",
                  "borderAlpha": "20",
                  "is2D": "1",
                  "numberPrefix": "$",
                  "numberSuffix": "M",
                  "plotTooltext": "$label of $$value ",
                  "chartLeftMargin": "40",
                  "width": "100%",
                "height": "350",
                  "theme": "fusion"
              },
         data: [{ label: '0-30', value: this.day30 },
          { label: '31-60', value: this.day60 },
          { label: '61-90', value: this.day90 },
          { label: '91-120', value: this.day120 },
          { label: '121-180', value: this.day180 },
          { label: '181-365', value: this.day365 },
          { label: '365+', value: this.day366 }
          ],
        }
      this.touch.push(data.data.touch_analysis);
       console.log(this.touch)
       for( const value of this.touch){

         this.janless3=value.January.less3;
         this.janthree= value.January.three;
         this.janfour= value.January.four;
         this.janfive=value.January.five;
         this.jansix= value.January.six;
         this.jansixplus= value.January.sixplus;

         this.febless3=value.February.less3;
         this.febthree= value.February.three;
         this.febfour= value.February.four;
         this.febfive=value.February.five;
         this.febsix= value.February.six;
         this.febsixplus= value.February.sixplus;

         this.marless3=value.March.less3;
         this.marthree= value.March.three;
         this.marfour= value.March.four;
         this.marfive=value.March.five;
         this.marsix= value.March.six;
         this.marsixplus= value.March.sixplus;

         this.aprless3=value.April.less3;
         this.aprthree= value.April.three;
         this.aprfour= value.April.four;
         this.aprfive=value.April.five;
         this.aprsix= value.April.six;
         this.aprsixplus= value.April.sixplus;

         this.mayless3=value.May.less3;
         this.maythree= value.May.three;
         this.mayfour= value.May.four;
         this.mayfive=value.May.five;
         this.maysix= value.May.six;
         this.maysixplus= value.May.sixplus;

         this.juneless3=value.June.less3;
         this.junethree= value.June.three;
         this.junefour= value.June.four;
         this.junefive=value.June.five;
         this.junesix= value.June.six;
         this.junesixplus= value.June.sixplus;

         this.julyless3=value.July.less3;
         this.julythree= value.July.three;
         this.julyfour= value.July.four;
         this.julyfive=value.July.five;
         this.julysix= value.July.six;
         this.julysixplus= value.July.sixplus;

         this.augless3=value.August.less3;
         this.augthree= value.August.three;
         this.augfour= value.August.four;
         this.augfive=value.August.five;
         this.augsix= value.August.six;
         this.augsixplus= value.August.sixplus;

         this.sepless3=value.September.less3;
         this.septhree= value.September.three;
         this.sepfour= value.September.four;
         this.sepfive=value.September.five;
         this.sepsix= value.September.six;
         this.sepsixplus= value.September.sixplus;

         this.octless3=value.October.less3;
         this.octthree= value.October.three;
         this.octfour= value.October.four;
         this.octfive=value.October.five;
         this.octsix= value.October.six;
         this.octsixplus= value.October.sixplus;

         this.novless3=value.November.less3;
         this.novthree= value.November.three;
         this.novfour= value.November.four;
         this.novfive=value.November.five;
         this.novsix= value.November.six;
         this.novsixplus= value.November.sixplus;

         this.decless3=value.December.less3;
         this.decthree= value.December.three;
         this.decfour= value.December.four;
         this.decfive=value.December.five;
         this.decsix= value.December.six;
         this.decsixplus= value.December.sixplus;
        }
    this.stacked={
      "chart": {
          "xAxisname": "",
          "yAxisName": "",
        "plotSpacePercent": "70",
        "palettecolors": "#3ad6b1,#40beec,#90a3d1,#f3d9a1,#94d39d,#e2b170,#ddc19d,#57b8a2",
        "showValues": "0",
        "showLegend": "0",
        "width": "100%",
        "height": "100%",
          "theme": "fusion",
      },
      "categories": [{
        "category": [
            {"label": "Jan"},
            {"label": "Feb"},
            {"label": "Mar"},
            {"label": "Apr"},
            {"label": "May"},
            {"label": "Jun"},
            {"label": "Jul"},
            {"label": "Aug"},
            {"label": "Sep"},
            {"label": "Oct"},
            {"label": "Nov"},
            {"label": "Dec"}
        ]
    }],
      dataset: [{
    "seriesname": "&lt; 3 Touches",
        data: [
            {value: this.janless3},
            {value: this.febless3},
            {value: this.marless3},
            {value: this.aprless3},
            {value: this.mayless3},
            {value: this.juneless3},
            {value: this.julyless3},
            {value: this.augless3},
            {value: this.sepless3},
            {value: this.octless3},
            {value: this.novless3},
            {value: this.decless3}
        ]
    },
    {
        "seriesname": "3 Touches",
        "data": [
          {value: this.janthree},
          {value: this.febthree},
          {value: this.marthree},
          {value: this.aprthree},
          {value: this.maythree},
          {value: this.junethree},
          {value: this.julythree},
          {value: this.augthree},
          {value: this.septhree},
          {value: this.octthree},
          {value: this.novthree},
          {value: this.decthree}
          ]
        },
        {
            "seriesname": "4 Touches",
            "data": [
                {value: this.janfour},
                {value: this.febfour},
                {value: this.marfour},
                {value: this.aprfour},
                {value: this.mayfour},
                {value: this.junefour},
                {value: this.julyfour},
                {value: this.augfour},
                {value: this.sepfour},
                {value: this.octthree},
                {value: this.novthree},
                {value: this.decthree}
            ]},
            {
            "seriesname": "5 Touches",
            "data": [
                {value: this.janfive},
                {value: this.febfive},
                {value: this.marfive},
                {value: this.aprfive},
                {value: this.mayfive},
                {value: this.junefive},
                {value: this.julyfive},
                {value: this.augfive},
                {value: this.sepfive},
                {value: this.octfive},
                {value: this.novfive},
                {value: this.decfive}
            ]},
            {
            "seriesname": "6 Touches",
            "data": [
              {value: this.jansix},
              {value: this.febsix},
              {value: this.marsix},
              {value: this.aprsix},
              {value: this.maysix},
              {value: this.junesix},
              {value: this.julysix},
              {value: this.augsix},
              {value: this.sepsix},
              {value: this.octsix},
              {value: this.novsix},
              {value: this.decsix}
            ]},
            {
            "seriesname": ">6 Touches",
            "data": [
              {value: this.jansixplus},
              {value: this.febsixplus},
              {value: this.marsixplus},
              {value: this.aprsixplus},
              {value: this.maysixplus},
              {value: this.junesixplus},
              {value: this.julysixplus},
              {value: this.augsixplus},
              {value: this.sepsixplus},
              {value: this.octsixplus},
              {value: this.novsixplus},
              {value: this.decsixplus}
            ]
    }]
    }

    //Associates Performance
  this.performance.push(data.data.performance);
  console.log(this.performance);
  for( const per of this.performance){
    for( const res of per){
      this.user=res.name;
      this.pending=res.pending;
      this.assign=res.assign;
      this.worked=res.worked;
      this.resolved=res.resolved;

      this.associates_chart.push({
        "label": this.user,
    })
    this.associates_chart_pending.push({
      "value": this.pending,
  })
    this.associates_chart_assign.push({
      "value":this.assign
    })
    this.associates_chart_worked.push({
      "value":this.assign
    })
    this.associates_chart_resolved.push({
      "value":this.assign
    })
    }
    console.log(this.associates_chart_pending)
  }
  this.stacked_chart={
          "chart": {
            "caption": "",
            "subcaption": "",
            "xAxisName": "",
            "pYAxisName": "",
            "sYAxisName": "",
            "numberPrefix": "",
            "numbersuffix": "",
            "sNumberSuffix": "%",
            "sYAxisMaxValue": "25",
            "divlineAlpha": "100",
            "divlineColor": "#999999",
            "palettecolors": "#e08c92,#b1ceb5,#e1e3cd,#80bde7,#57b8a2",
            "divlineThickness": "1",
            "divLineDashed": "1",
            "divLineDashLen": "1",
            "width":"100%",
            "height":"100%",
            "theme": "fusion"
          },
          "categories": [
              { category:  this.associates_chart }
          ],
          "dataset": [{
            "dataset": [{
                "seriesname": "Assigned Claims",
                 "data": this.associates_chart_assign
            },
            {
                "seriesname": "Pending Claims",
                "data": this.associates_chart_pending
            },
            {
                "seriesname": "Worked Claims",
                "data": this.associates_chart_worked
            }
        ]
        },
              {
                  "dataset": [{
                    "seriesname": "Resolved Claims",
                    "data": this.associates_chart_resolved
                }]
              }
          ]
        }
    //Payer Classification
    this.payer_classfication.push(data.data.payer_classfication.insurance);
    console.log(this.payer_classfication);

    for( const value of this.payer_classfication)
    {
    for( const payer of value)
    {
      if(payer.Insurance==null){
        this.name='null';
      }else{
        this.name=payer.Insurance;
      }

  this.total=payer.totalCharges
  // this.chartData +='{"label":"'+ this.name+'","value":'+ this.total+'},';
      this.chartData.push({
         "label":  this.name,
         "value": this.total
       })
  }
   console.log(this.chartData)
    }
    this.dataSource = {
      "chart": {
        "showLegend": "0",
         "showLabels": "0",
        "showValues": "0",
        "numberPrefix" : "$",
        "enableMultiSlicing":"1",
        "width": "500",
        "height": "300",
        "theme":"fusion"
      },
       data: this.chartData
    };

        //Status Code
        this.status_code.push(data.data.status_code.header);
        this.statusFooter.push(data.data.status_code.footer);
        //console.log(this.status_code);
        for(const value of this.status_code){
          for( const status of value){

            this.name=status.statusCode,
            this.total=status.statusValue;

            this.status_chart.push({
              "label": this.name,
              "value": this.total
          })
          }
          //console.log(this.status_chart)
        }
        this.pie3d = {
          "chart": {
            "showLegend": "0",
             "showLabels": "0",
            "showValues": "0",
            "palettecolors": "#ef7e86,#faeb6b,#80c3dc,#bea4dc,#94d39d,#e2b170,#ddc19d,#57b8a2",
            "numberPrefix" : "$",
            "enableMultiSlicing":"1",
            "width": "500",
          "height": "300",
          "renderAt": 'status_chart',
            "theme": "fusion"
          },
          data:  this.status_chart
      };


  });
  }

    public error_data:string='';
    notifications =[];
    public assign_err(data:any)
    {
      if(data != undefined)
      {
      this.error_data = data;
      setTimeout(() => {
        this.error_data = '';
      }, 1500);

      this.setus.dashboard_warning('');
    }
  }
  //Red Alerrt Box
  private _opened: boolean = false;
  private isOpen: boolean = false;
  private _positionNum: number = 0;
  private _modeNum: number = 0;
  private closeOnClickOutside: boolean = false;

  private _MODES: Array<string> = ['push'];
  private _POSITIONS: Array<string> = ['right'];

  private redalert() {
   this._opened = !this._opened;
  }
  private mynotes(){
      this.isOpen=!this.isOpen;
  }
  private _togglePosition(): void {
   this._positionNum++;

   if (this._positionNum === this._POSITIONS.length) {
     this._positionNum = 0;
   }
  }
  private ClickOutside(): void {
      this.closeOnClickOutside = !this.closeOnClickOutside;
    }
  private _toggleMode(): void {
   this._modeNum++;

   if (this._modeNum === this._MODES.length) {
     this._modeNum = 0;
   }
  }

  private _toggleCloseOnClickOutside(){
      this.closeOnClickOutside=!this.closeOnClickOutside;
  }





  stacked3={
      "chart": {
          "caption": "",
              "subCaption": "",
              "xAxisName": "",
              "yAxisName": "",
              "plotSpacePercent": "50",
              "palettecolors": "#ef7e86,#94d39d,#80c3dc,#bea4dc,#94d39d,#e2b170,#faeb6b,#57b8a2",
              "showValues": "0",
              "theme": "fusion"
      },
      "categories": [
          {
              "category": [
                  {"label": "Jan"},
                  {"label": "Feb"},
                  {"label": "Mar"},
                  {"label": "Apr"},
                  {"label": "May"},
                  {"label": "Jun"},
                  {"label": "Jul"},
                  {"label": "Aug"},
                  {"label": "Sep"},
                  {"label": "Oct"},
                  {"label": "Nov"},
                  {"label": "Dec"}
              ]
          }
      ],
      "dataset": [
          {
              "seriesname": "Total",
              "data": [
                  {"value": "23"},
                  {"value": "43"},
                  {"value": "21"},
                  {"value": "123"},
                  {"value": "43"},
                  {"value": "75"},
                  {"value": "79"},
                  {"value": "134"},
                  {"value": "85"},
                  {"value": "66"},
                  {"value": "27"},
                  {"value": "38"},
                  {"value": "88"}
              ]
          },
          {
              "seriesname": "Closed",
              "data": [
                  {"value": "11"},
                  {"value": "43"},
                  {"value": "20"},
                  {"value": "88"},
                  {"value": "26"},
                  {"value": "54"},
                  {"value": "23"},
                  {"value": "99"},
                  {"value": "54"},
                  {"value": "22"},
                  {"value": "27"},
                  {"value": "32"}
              ]
          },
      ]
  }
  ngOnInit() {
    console.log('Dashboard in');
    // this.auth.tokenValue.next(false);
    // this.assign_err(this.setus.get_error());
    // this.process_notify(this.notify_service.getuser_Id());

  }

  ngAfterViewInit() {
    console.log('LAST IN DASHBOARD COMP');

    // this.auth.tokenValue.next(true);
    if(this.auth.tokenValue.value == true )
    {let data = localStorage.getItem('token');
    this.auth.login(data);
  }
//  if(localStorage.getItem('role') =='Admin'){
//       this.auth.tokenValue.next(true);
//       let data = localStorage.getItem('token');
//       this.auth.login(data);
//     }

  }


}
