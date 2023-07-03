<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\Action;
use App\Models\AutoCloseClaimModel;
use App\Models\Claim_history;
use App\Models\Claim_note;
use App\Models\File_upload;
use App\Models\Import_field;
use App\Models\Line_item;
use App\Models\Reimport;
use App\Models\Statuscode;
use App\Models\Sub_statuscode;
use App\Models\User;
use App\Models\Workorder_user_field;
use Carbon\Carbon;
use DateTime;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Validator;
use App\Helpers\Record_claim_history;
use App\Imports\ImportClaims;
use App\Imports\ImportNewClaims;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class ImportController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['upload', 'get_upload_table_page', 'getfile', 'template', 'createclaim', 'updatemismatch', 'overwrite', 'overwrite_all', 'get_table_page', 'get_related_calims', 'fetch_export_data', 'get_line_items', 'delete_upload_file', 'process_upload_file', 'get_audit_table_page', 'updateingnore', 'get_file_ready_count', 'updateAutoClose', 'get_payer_name', 'reImport', 'get_reimport_table_page', 'reimport_template', 'move_create_work_order', 'get_reassigned_users', 'audit_claims_found_user']]);
    }



    /*To download the file from Server*/

    public function getfile(LoginRequest $request)
    {
        try {
            $id = $request->get('id');
            $data = File_upload::where('id', $id)->first();
            $newName = $data['file_name'];

            $filePath = storage_path('app/public/uploads/' . $data['file_url']);
            $headers = [
                'Content-Type' => 'application/pdf',
             ];

            if (file_exists($filePath)) {
                return response()->download($filePath, $newName, $headers);
            } else {
                return response()->json(['error' => 'File not found.'], 404);
            }

        } catch (Exception $e) {
            Log::debug('get file error :' . $e->getMessage());
        }
    }

    /*Upload Claim CSV file and Upload Data into DB*/
    public function upload(LoginRequest $request)
    {
        try {
            $practice_dbid = $request->get('practice_dbid');
            $savedata = $request->file('file_name');
            $filenames = $request->file('file_name')->getClientOriginalName();
            $user = $request->get('user_id');
            $unique_name = md5($filenames . time());
            $filename = date('Y-m-d') . '_' . $filenames;
            $path = "../uploads";
            $savedata->move($path, $unique_name);
            $path = "../uploads/" . $unique_name;
            $report_date = $request->get('report_date');
            $notes = $request->get('notes');

            $importClaims = new ImportNewClaims($filename, $report_date, $notes, $user, $unique_name, $practice_dbid);
            // Excel::import(new ImportClaims, $filenames);
            Excel::import($importClaims, $request->file('file_name')->store('files'));

            // Excel::import($importClaims, $filenames);
            Log::info('upload checking');
            // Log::debug(print_r($importClaims, true));

            return response()->json([
                // 'message' =>  $importClaims,
                'upload_msg'  => "Upload Complete"
            ]);
        } catch (Exception $e) {
            Log::debug($e->getMessage() . $e->getLine());
            throw new Exception($e->getMessage());
        }
    }

    public function createclaim(LoginRequest $request)
    {
        $created_id = [];
        $user = $request->get('user_id');
        $claim = $request->get('claim');
        $file_det = $request->get('file');

        // echo '<pre>'; print_r($claim); die;


        $i = 0;
        // $claim_history_data;
        foreach ($claim as $key => $value) {

            $value['file_upload_id'] = $file_det['id'];
            $value['assigned_to'] = null;


            if ($value['dos'] == 0) {
                $value['dos'] = '';
            } else {
                $value['dos'] = date('Y-m-d', strtotime($value['dos']));
            }

            if ($value['discharge_date'] == 0) {
                $value['discharge_date'] = '';
            } else {
                $value['discharge_date'] = date('Y-m-d', strtotime($value['discharge_date']));
            }

            if ($value['admit_date'] == 0) {
                $value['admit_date'] = '';
            } else {
                $value['admit_date'] = date('Y-m-d', strtotime($value['admit_date']));
            }


            if ($value['dob'] == 0) {
                $value['dob'] = '';
            } else {
                $value['dob'] = date('Y-m-d', strtotime($value['dob']));
            }

            if ($value['total_charges'] == null) {
                $value['total_charges'] = 0.00;
            } else {
                $value['total_charges'] = $value['total_charges'];
            }

            if ($value['pat_ar'] == null) {
                $value['pat_ar'] = 0.00;
            } else {
                $value['pat_ar'] = $value['pat_ar'];
            }

            if ($value['ins_ar'] == null) {
                $value['ins_ar'] = 0.00;
            } else {
                $value['ins_ar'] = $value['ins_ar'];
            }

            if ($value['total_ar'] == null) {
                $value['total_ar'] = 0.00;
            } else {
                $value['total_ar'] = $value['total_ar'];
            }


            if ($value['billedlast_submit_date'] == 0) {
                $value['billedlast_submit_date'] = '';
            } else {
                $value['billedlast_submit_date'] = date('Y-m-d', strtotime($value['billedlast_submit_date']));
            }
            // if(gettype($value['dos']) =='array')
            // {
            //     $date = explode(" ", $value['dos']['date']);
            // }
            // else if($value['dos'] == 0 || $value['dos'] == '')
            // {
            //     $date=0000;
            // }
            // else{
            //     $date = explode(" ", $value['dos']);
            // }
            // $value['dos'] = date('Y-m-d', strtotime($date[0]));

            // $date_type=0;



            // if($value['discharge_date']== 0 && $value['admit_date'] == 0 )
            // {
            //     $value['discharge_date']=$value['dos'];
            //     $value['admit_date']=$value['dos'];
            //     $date_type=1;

            // }
            // else if($value['discharge_date']== 0 && $value['admit_date'] != 0 )
            // {
            //     $discharge_date=$value['admit_date'];
            //     $admit_date=$value['admit_date'];
            // }
            // else if($value['discharge_date']!= 0 && $value['admit_date'] == 0 )
            // {
            //     $admit_date=$value['discharge_date'];
            //     $discharge_date=$value['discharge_date'];
            // }
            // else
            // {
            //     $discharge_date=$value['discharge_date'];
            //     $admit_date=$value['admit_date'];

            // }

            // if($date_type != 1)
            // {

            //   if(gettype($discharge_date)=='array')
            //   {
            //       $date = explode(" ", $discharge_date['date']);
            //   }
            //   else{
            //       $date = explode(" ", $discharge_date);
            //   }
            //   $value['discharge_date'] = date('m/d/Y', strtotime($date[0]));


            //   if(gettype($admit_date)=='array')
            //   {
            //        $date = explode(" ", $admit_date['date']);
            //   }
            //   else{
            //       $date = explode(" ", $admit_date);
            //   }
            //   $value['admit_date'] = date('m/d/Y', strtotime($date[0]));
            // }


            $check_line_items = Line_item::where('claim_id', $value['claim_no'])->count();

            // if( $check_line_items != 0 )
            // {
            //     DB::table('line_items')->where('claim_id', $value['claim_no'])->delete();
            // }

            $import_line = Line_item::create(
                array(
                    'claim_id'          => $value['claim_no'],
                    'total_ar_due'      => $value['total_ar'],
                    'ins_ar'            => $value['ins_ar'],
                    'pat_ar'            => $value['pat_ar'],
                    'units'             => $value['units'],
                    'modifier'          => $value['modifiers'],
                    'icd'               => $value['icd'],
                    'cpt'               => $value['cpt'],
                    'dos'               => $value['dos']
                )
            );

            $check_claim = Import_field::where('claim_no', $value['claim_no'])->count();


            if ($check_claim == 0) {
                $import_store = $value;

                //dd($value);

                //foreach($import_store as $value){
                // dd($value['acct_no']);
                // dd($value);
                //dd($value['pat_ar']);


                $import = Import_field::create(
                    [
                        'acct_no' => $value['acct_no'],
                        'claim_no' => $value['claim_no'],
                        'patient_name' => $value['patient_name'],
                        'dos' => $value['dos'],
                        'dob' => $value['dob'],
                        'ssn' => $value['ssn'],
                        'gender' => $value['gender'],
                        'phone_no' => $value['phone_no'],
                        'address_1' => $value['address_line_1'],
                        'address_2' => $value['address_line_2'],
                        'city' => $value['city'],
                        'state' => $value['state'],
                        'zipcode' => $value['zipcode'],

                        'guarantor' => $value['guarantor'],
                        'employer' => $value['employer'],
                        'responsibility' => $value['responsibility'],
                        'insurance_type' => $value['insurance_type'],

                        'prim_ins_name' => $value['primary_insurance_name'],
                        'prim_pol_id' => $value['primary_policy_id'],
                        'prim_group_id' => $value['primary_group_id'],
                        'prim_address_1' => $value['primary_insurance_address_line_1'],
                        'prim_address_2' => $value['primary_insurance_address_line_2'],
                        'prim_city' => $value['primary_insurance_city'],
                        'prim_state' => $value['primary_insurance_state'],
                        'prim_zipcode' => $value['primary_insurance_zipcode'],

                        'sec_ins_name' => $value['secondary_insurance_name'],
                        'sec_pol_id' => $value['secondary_policy_id'],
                        'sec_group_id' => $value['secondary_group_id'],
                        'sec_address_1' => $value['secondary_insurance_address_line_1'],
                        'sec_address_2' => $value['secondary_insurance_address_line_2'],
                        'sec_city' => $value['secondary_insurance_city'],
                        'sec_state' => $value['secondary_insurance_state'],
                        'sec_zipcode' => $value['secondary_insurance_zipcode'],

                        'ter_ins_name' => $value['tertiary_insurance_name'],
                        'ter_pol_id' => $value['tertiary_policy_id'],
                        'ter_group_id' => $value['tertiary_group_id'],
                        'ter_address_1' => $value['tertiary_insurance_address_line_1'],
                        'ter_address_2' => $value['tertiary_insurance_address_line_2'],
                        'ter_city' => $value['tertiary_insurance_city'],
                        'ter_state' => $value['tertiary_insurance_state'],
                        'ter_zipcode' => $value['tertiary_insurance_zipcode'],

                        'auth_no' => $value['authorization'],
                        'rendering_prov' => $value['rendering_provider'],
                        'billing_prov' => $value['billing_provider'],
                        'facility' => $value['facility'],
                        'admit_date' => $value['admit_date'],
                        'discharge_date' => $value['discharge_date'],
                        'cpt' => $value['cpt'],
                        'icd' => $value['icd'],
                        'modifiers' => $value['modifiers'],
                        'units' => $value['units'],
                        'total_charges' => $value['total_charges'],
                        'pat_ar' => $value['pat_ar'],
                        'ins_ar' => $value['ins_ar'],
                        'total_ar' => $value['total_ar'],
                        'claim_Status' => $value['claim_Status'],
                        'billed_submit_date' => $value['billedlast_submit_date'],
                        'denial_code' => trim($value['denial_code']),
                        'claim_note' => $value['claim_note'],
                        'file_upload_id' => $value['file_upload_id'],
                        'assigned_to' => $value['assigned_to'],
                    ]
                );

                $claim_no = $value['claim_no'];
                $claim_note = $value['claim_note'];

                if (!empty($claim_note)) {
                    $notes_insert = Claim_note::create(
                        [
                            'claim_id'         => $claim_no,
                            'state'            => 'Active',
                            'content'          => $claim_note,
                            'created_by'       => $user
                        ]
                    );
                }


                array_push($created_id, $key);
                $claim_history_data[$i] = ["claim_no" => $value['claim_no'], "state" => '1', "assigned_by" => $user, "assigned_to" => null];

                $i++;
            }
        }

        $data = Record_claim_history::create_history($claim_history_data);

        $update = array('claims_processed' => '1', 'updated_at' => date('Y-m-d h:i:s'));

        $update_val = DB::table('file_uploads')->where('id', $file_det['id'])->update($update);

        return response()->json([
            'message' =>  $created_id,
            'error'  => "Created"
        ]);
    }

    public function updateingnore(LoginRequest $request)
    {
        $upload_id = $request->get('upload_id');

        // $update_ignore = DB::table('file_uploads')->where('id',$upload_id)->update(
        //     [
        //         'total_claims' => 0,

        //     ]);

        return response()->json([
            //'message'=>  $update_ignore,
            'error'  => "updated",
            'upload_id' => $upload_id
        ]);
    }

    public function updatemismatch(LoginRequest $request)
    {
        $output = [];

        $data = $request->get('info');

        $key = $data[0];
        $value = $data[1];
        $z = 0;
        foreach ($key as  $k => $sub) {
            $update = [];
            foreach ($sub as $i => $sub2) {
                $update[$sub2] = $value[$k][$i];
                $z++;
            }

            $update_val = DB::table('import_fields')->where('claim_no', $k)->update($update);


            if ($update_val == 0) {
                $output[$k] = $k;
            }
            $update = array('claims_processed' => '1', 'updated_at' => date('Y-m-d h:i:s'));

            $update_val = DB::table('file_uploads')->where('id', $update_val['file_upload_id'])->update($update);
        }



        return response()->json([
            'message' => $output,
            'error'  => "Created"
        ]);
    }

    public function overwrite(LoginRequest $request)
    {
        $data = $request->get('info');
        $user = $request->get('user_id');

        $claim = $data[0];
        $notes = $data[2];
        $update[$data[1]] = $data[2];
        $filed_name = $data[1];
        if ($filed_name == 'primary_policy_id') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['prim_pol_id' => $update[$data[1]]]);
        } else if ($filed_name == 'address_line_1') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['address_1' => $update[$data[1]]]);
        } else if ($filed_name == 'address_line_2') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['address_2' => $update[$data[1]]]);
        } else if ($filed_name == 'primary_insurance_name') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['prim_ins_name' => $update[$data[1]]]);
        } else if ($filed_name == 'primary_group_id') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['prim_group_id' => $update[$data[1]]]);
        } else if ($filed_name == 'primary_insurance_address_line_1') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['prim_address_1' => $update[$data[1]]]);
        } else if ($filed_name == 'primary_insurance_address_line_2') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['prim_address_2' => $update[$data[1]]]);
        } else if ($filed_name == 'primary_insurance_city') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['prim_city' => $update[$data[1]]]);
        } else if ($filed_name == 'primary_insurance_state') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['prim_state' => $update[$data[1]]]);
        } else if ($filed_name == 'primary_insurance_zipcode') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['prim_zipcode' => $update[$data[1]]]);
        } else if ($filed_name == 'secondary_insurance_name') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['sec_ins_name' => $update[$data[1]]]);
        } else if ($filed_name == 'secondary_policy_id') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['sec_pol_id' => $update[$data[1]]]);
        } else if ($filed_name == 'secondary_group_id') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['sec_group_id' => $update[$data[1]]]);
        } else if ($filed_name == 'secondary_insurance_address_line_1') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['sec_address_1' => $update[$data[1]]]);
        } else if ($filed_name == 'secondary_insurance_address_line_1') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['sec_address_1' => $update[$data[1]]]);
        } else if ($filed_name == 'secondary_insurance_address_line_2') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['sec_address_2' => $update[$data[1]]]);
        } else if ($filed_name == 'secondary_insurance_city') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['sec_city' => $update[$data[1]]]);
        } else if ($filed_name == 'secondary_insurance_state') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['sec_state' => $update[$data[1]]]);
        } else if ($filed_name == 'secondary_insurance_zipcode') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['sec_zipcode' => $update[$data[1]]]);
        } else if ($filed_name == 'tertiary_insurance_name') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['ter_ins_name' => $update[$data[1]]]);
        } else if ($filed_name == 'tertiary_policy_id') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['ter_pol_id' => $update[$data[1]]]);
        } else if ($filed_name == 'tertiary_group_id') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['ter_group_id' => $update[$data[1]]]);
        } else if ($filed_name == 'tertiary_insurance_address_line_1') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['ter_address_1' => $update[$data[1]]]);
        } else if ($filed_name == 'tertiary_insurance_address_line_2') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['ter_address_2' => $update[$data[1]]]);
        } else if ($filed_name == 'tertiary_insurance_city') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['ter_city' => $update[$data[1]]]);
        } else if ($filed_name == 'tertiary_insurance_state') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['ter_state' => $update[$data[1]]]);
        } else if ($filed_name == 'tertiary_insurance_zipcode') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['ter_zipcode' => $update[$data[1]]]);
        } else if ($filed_name == 'authorization') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['auth_no' => $update[$data[1]]]);
        } else if ($filed_name == 'rendering_provider') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['rendering_prov' => $update[$data[1]]]);
        } else if ($filed_name == 'billing_provider') {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update(['billing_prov' => $update[$data[1]]]);
        } else {
            $update_val = DB::table('import_fields')->where('claim_no', $claim)->update($update);
        }

        $update_val = 1;

        if ($data[1] == 'claim_note') {
            $notes_insert = DB::table('claim_notes')->where('claim_id', $claim)->where('created_by', $user)->update(
                [
                    'claim_id'         => $claim,
                    'state'            => 'Active',
                    'content'          => $notes,
                    'created_by'       => $user
                ]
            );
        }

        return response()->json([
            'message' => $update_val,
            'error'  => "Completed"
        ]);
    }



    public function overwrite_all(LoginRequest $request)
    {
        $data = $request->get('info');
        $user = $request->get('user_id');
        $field = $data[0];
        $claims = $data[1];
        $values = $data[2];

        foreach ($claims as $key => $value) {
            $update_val = DB::table('import_fields')->where('claim_no', $value)->update(array($field => $values[$value]));
            //dd($values[$value]);
            if ($field == 'claim_note') {
                $notes_insert = DB::table('claim_notes')->where('claim_id', $value)->where('created_by', $user)->update(
                    [
                        'claim_id'         => $value,
                        'state'            => 'Active',
                        'content'          => $values[$value],
                        'created_by'       => $user
                    ]
                );
            }
        }

        $update_val = 1;


        return response()->json([
            'message' =>  $update_val,
            'error'  => "Completed"
        ]);
    }



    public function template(LoginRequest $request)
    {
        $practice_dbid = $request->get('practice_dbid');
        $destinationPath = public_path('../config/test/' . $practice_dbid . 'test.txt');

        if (!file_exists($destinationPath)) {
            $file_filter = "No file";
        } else {

            $file_filter = json_decode(file_get_contents($destinationPath), true);

            $file_filter_keys = array_keys($file_filter);
        }




        $destinationPath = public_path('../config/test/fields_name.txt');
        $headers = [
            'Content-Type' => 'application/pdf',
        ];
        if (!file_exists($destinationPath)) {
            $jsondec = "No file";
        } else {
            $jsondec = json_decode(file_get_contents($destinationPath), true);



            $val = [];
            $i = 0;
            foreach ($jsondec as $key => $value) {
                // $key=str_replace("_"," ",$key);
                if ($file_filter == 'No file') {
                    $val[$i] = $value;
                    $i++;
                } elseif (in_array($key, $file_filter_keys)) {
                    if ($file_filter[$key][0] == true) {
                        $val[$i] = $value;
                        $i++;
                    }
                }
            }
            $data1 = $val;

            $data2 = ['Account Number', 'Claim No', 'DOS', 'DOB'];

            $data = array_merge($data2, $data1);



            //dd($data);

            // Excel::create('template', function($excel) {

            //     $destinationPath=public_path('../config/test/test.txt');


            //             $jsondec = json_decode(file_get_contents($destinationPath) , true);



            // $val=[];
            // $i=0;
            //     foreach($jsondec as $key=>$value)
            //     {
            //         $key=str_replace("_"," ",$key);
            //       $val[$i]=$key;
            //       $i++;
            //     }
            //     $data = $val;
            //     $excel->sheet('Sheet 1', function ($sheet) use ($data) {
            //         $sheet->setOrientation('landscape');
            //         $sheet->fromArray($data, NULL, 'A1');
            //     });

            // })->download($headers,);
        }


        return response()->json([
            'message' => $data,
            'error'  => "Template Downloaded."
        ]);
    }

    public function get_table_page(LoginRequest $request)
    {
        try {
            $searchValue = $request->get('createsearch');

            $claim_datas = Import_field::whereNull('followup_work_order')->where('claim_Status', Null)->orderBy('created_at', 'desc');

            if (isset($searchValue['dos']) && $searchValue['dos']['startDate'] != null) {
                $dos_sart_date = Carbon::createFromFormat('Y-m-d', $searchValue['dos']['startDate'])->startOfDay();
                $dos_end_date = Carbon::createFromFormat('Y-m-d', $searchValue['dos']['endDate'])->endOfDay();

                $claim_datas->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
            }

            if (isset($searchValue['age_filter']) && $searchValue['age_filter'] != null) {
                $search_age = $searchValue['age_filter'];
                if ($search_age['from_age'] == 0 && $search_age['to_age'] == 30) {
                    $last_thirty = Carbon::now()->subDay($search_age['to_age']);
                    $claim_datas->where(DB::raw('DATE(import_fields.dos)'), '>', $last_thirty);
                }
                if ($search_age['from_age'] == 31 && $search_age['to_age'] == 60) {
                    $to_age = Carbon::now()->subDay($search_age['to_age']);
                    $from_age = Carbon::now()->subDay($search_age['from_age']);
                    $claim_datas->where(DB::raw('DATE(import_fields.dos)'), '>=', $to_age)->where(DB::raw('DATE(import_fields.dos)'), '<=', $from_age);
                }
                if ($search_age['from_age'] == 61 && $search_age['to_age'] == 90) {
                    $to_age = Carbon::now()->subDay($search_age['to_age']);
                    $from_age = Carbon::now()->subDay($search_age['from_age']);
                    $claim_datas->where(DB::raw('DATE(import_fields.dos)'), '>=', $to_age)->where(DB::raw('DATE(import_fields.dos)'), '<=', $from_age);
                }
                if ($search_age['from_age'] == 91 && $search_age['to_age'] == 120) {
                    $to_age = Carbon::now()->subDay($search_age['to_age']);
                    $from_age = Carbon::now()->subDay($search_age['from_age']);
                    $claim_datas->where(DB::raw('DATE(import_fields.dos)'), '>=', $to_age)->where(DB::raw('DATE(import_fields.dos)'), '<=', $from_age);
                }
                if ($search_age['from_age'] == 121 && $search_age['to_age'] == 180) {
                    $to_age = Carbon::now()->subDay($search_age['to_age']);
                    $from_age = Carbon::now()->subDay($search_age['from_age']);
                    $claim_datas->where(DB::raw('DATE(import_fields.dos)'), '>=', $to_age)->where(DB::raw('DATE(import_fields.dos)'), '<=', $from_age);
                }
                if ($search_age['from_age'] == 181 && $search_age['to_age'] == 365) {
                    $to_age = Carbon::now()->subDay($search_age['to_age']);
                    $from_age = Carbon::now()->subDay($search_age['from_age']);
                    $claim_datas->where(DB::raw('DATE(import_fields.dos)'), '>=', $to_age)->where(DB::raw('DATE(import_fields.dos)'), '<=', $from_age);
                }
            }

            if (isset($searchValue['claim_no']) && !empty($searchValue['claim_no'])) {
                $claim_datas->where('claim_no', $searchValue['claim_no']);
            }

            if (isset($searchValue['acc_no']) && !empty($searchValue['acc_no'])) {
                $claim_datas->where('acct_no', $searchValue['acc_no']);
            }

            if (isset($searchValue['patient_name']) && !empty($searchValue['patient_name'])) {
                $claim_datas->where('patient_name', 'LIKE', '%' . $searchValue['patient_name'] . '%');
            }

            if (isset($searchValue['responsibility']) && !empty($searchValue['responsibility'])) {
                $claim_datas->where('responsibility', 'LIKE', '%' . $searchValue['responsibility'] . '%');
            }

            if (isset($searchValue['total_ar']) && !empty($searchValue['total_ar'])) {
                $OriginalString = trim($searchValue['total_ar']);
                $tot_ar = explode("-", $OriginalString);
                $min_tot_ar = $tot_ar[0] - 1.00;
                $max_tot_ar = $tot_ar[1];

                $claim_datas->whereBetween('total_ar', [$min_tot_ar, $max_tot_ar]);
            }

            if (isset($searchValue['rendering_provider']) && !empty($searchValue['rendering_provider'])) {
                $claim_datas->where('rendering_prov', 'LIKE', '%' . $searchValue['rendering_provider'] . '%');
            }

            if (isset($searchValue['payer_name']) && !empty($searchValue['payer_name'])) {
                $claim_datas->where('prim_ins_name', 'LIKE', '%' . $searchValue['payer_name'] . '%');
                $claim_datas->orWhere('sec_ins_name', 'LIKE', '%' . $searchValue['payer_name'] . '%');
                $claim_datas->orWhere('ter_ins_name', 'LIKE', '%' . $searchValue['payer_name'] . '%');
            }

            if (isset($searchValue['date']) && $searchValue['date']['startDate'] != null) {
                $search_date = $searchValue['date'];
                $created_start_date = Carbon::createFromFormat('Y-m-d', $search_date['startDate'])->startOfDay();
                $created_end_date = Carbon::createFromFormat('Y-m-d', $search_date['endDate'])->endOfDay();

                $claim_datas->where(DB::raw('DATE(import_fields.created_at)'), '>=', $created_start_date)->where(DB::raw('DATE(import_fields.created_at)'), '<=', $created_end_date);
            }

            if (isset($searchValue['bill_submit_date']) && $searchValue['bill_submit_date']['startDate'] != null) {
                $search_submit_date = $searchValue['bill_submit_date'];
                $bill_start_date = Carbon::createFromFormat('Y-m-d', $search_submit_date['startDate'])->startOfDay();
                $bill_end_date = Carbon::createFromFormat('Y-m-d', $search_submit_date['endDate'])->endOfDay();

                $claim_datas->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
            }

            if (isset($searchValue['denial_code']) && !empty($searchValue['denial_code'])) {
                $claim_datas->where('denial_code', $searchValue['denial_code']);
            }

            // DB::enableQueryLog();
            $claim_data = $claim_datas->get();
            // dd(DB::getQueryLog());
            $claim_counts = $claim_datas->count();
            if (isset($claim_data)) {
                $claim_data = $this->arrange_claim_datas($claim_data);
                foreach ($claim_data as $key => $value) {
                    $dos = strtotime($claim_data[$key]['dos']);
                    $dobs = $claim_data[$key]['dos'];

                    if (!empty($dos) && $dos != 0000 - 00 - 00) {
                        $claim_data[$key]['dos'] = date('m-d-Y', $dos);
                    }

                    if ($dos == 0000 - 00 - 00) {
                        $claim_data[$key]['dos'] = 01 - 01 - 1970;
                    }

                    $dob = strtotime($claim_data[$key]['dob']);

                    if (!empty($dob)) {
                        $claim_data[$key]['dob'] = date('m-d-Y', $dob);
                    }

                    $admit_date = strtotime($claim_data[$key]['admit_date']);

                    if (!empty($admit_date)) {
                        $claim_data[$key]['admit_date'] = date('m-d-Y', $admit_date);
                    }

                    $discharge_date = strtotime($claim_data[$key]['discharge_date']);

                    if (!empty($discharge_date)) {

                        $claim_data[$key]['discharge_date'] = date('m-d-Y', $discharge_date);
                    }

                    if ($value['status_code'] == null) {
                        $claim_data[$key]['status_code'] = "NA";
                    } else {
                        $status_code = Statuscode::where('id', $value['status_code'])->get();
                        $claim_data[$key]['status_code'] = $status_code[0]['status_code'] . "-" . $status_code[0]['description'];
                    }

                    $assigned_data = Action::where('claim_id', $claim_data[$key]['claim_no'])->orderBy('created_at', 'desc')->first();

                    $from = DateTime::createFromFormat('m/d/Y', date('m/d/Y', strtotime($dobs)));

                    $to = date('d/m/Y');
                    $to = new DateTime;
                    $age = $to->diff($from);

                    $claim_data[$key]['age'] = $age->days;
                    $claim_data[$key]['touch'] = Claim_note::where('claim_id', $value['claim_no'])->count();
                }
            }

            return response()->json([
                'data'  => isset($claim_data) ? $claim_data : null,
                'total' => $claim_counts
            ]);
        } catch (Exception $e) {
            Log::debug('Get Table Page Error' . $e->getMessage());
        }
    }



    public function get_audit_table_page(LoginRequest $request)
    {
        try {
            $auditSearchValue = $request->get('audit_claim_searh');

            $claimInfo = Claim_history::orderBy('id', 'desc')->get()->unique('claim_id')->toArray();

            $audit = [];

            foreach ($claimInfo as $list) {
                if ($list['claim_state'] == 4)
                    array_push($audit, $list['claim_id']);
            }
            // DB::enableQueryLog();
            // $audit = Claim_history::where('claim_state', 4)->orderBy('id', 'desc')->distinct('claim_id')->pluck('claim_id')->toArray();
            // dd(DB::getQueryLog());

            $claim_data = Import_field::leftjoin(DB::raw("(SELECT claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
            })->leftjoin(DB::raw("(SELECT claim_histories.claim_id,claim_histories.created_at as created_ats
                  FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                  ) as claim_histories"), function ($join) {
                $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
            })->whereIN('claim_no', $audit)->orderBy('created_at', 'desc');

            if (isset($auditSearchValue['acc_no']) && !empty($auditSearchValue['acc_no'])) {
                $claim_data->where('acct_no', $auditSearchValue['acc_no']);
            }

            if (isset($auditSearchValue['claim_no']) && !empty($auditSearchValue['claim_no'])) {
                $claim_data->where('claim_no', $auditSearchValue['claim_no']);
            }

            if (isset($auditSearchValue['dos']) && $auditSearchValue['dos']['startDate'] != null) {
                $dos_start_date = Carbon::createFromFormat('Y-m-d', $auditSearchValue['dos']['startDate'])->startOfDay();
                $dos_end_date = Carbon::createFromFormat('Y-m-d', $auditSearchValue['dos']['endDate'])->endOfDay();

                $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
            }

            if (!empty($auditSearchValue['age_filter']) && $auditSearchValue['age_filter']['from_age'] != null && $auditSearchValue['age_filter']['to_age'] != null) {
                $search_age = $auditSearchValue['age_filter'];
                if ($search_age['from_age'] == 0 && $search_age['to_age'] == 30) {
                    $last_thirty = Carbon::now()->subDay($search_age['to_age']);
                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>', $last_thirty);
                }
                if ($search_age['from_age'] == 31 && $search_age['to_age'] == 60) {
                    $to_age = Carbon::now()->subDay($search_age['to_age']);
                    $from_age = Carbon::now()->subDay($search_age['from_age']);
                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $to_age)->where(DB::raw('DATE(import_fields.dos)'), '<=', $from_age);
                }
                if ($search_age['from_age'] == 61 && $search_age['to_age'] == 90) {
                    $to_age = Carbon::now()->subDay($search_age['to_age']);
                    $from_age = Carbon::now()->subDay($search_age['from_age']);
                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $to_age)->where(DB::raw('DATE(import_fields.dos)'), '<=', $from_age);
                }
                if ($search_age['from_age'] == 91 && $search_age['to_age'] == 120) {
                    $to_age = Carbon::now()->subDay($search_age['to_age']);
                    $from_age = Carbon::now()->subDay($search_age['from_age']);
                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $to_age)->where(DB::raw('DATE(import_fields.dos)'), '<=', $from_age);
                }
                if ($search_age['from_age'] == 121 && $search_age['to_age'] == 180) {
                    $to_age = Carbon::now()->subDay($search_age['to_age']);
                    $from_age = Carbon::now()->subDay($search_age['from_age']);
                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $to_age)->where(DB::raw('DATE(import_fields.dos)'), '<=', $from_age);
                }
                if ($search_age['from_age'] == 181 && $search_age['to_age'] == 365) {
                    $to_age = Carbon::now()->subDay($search_age['to_age']);
                    $from_age = Carbon::now()->subDay($search_age['from_age']);
                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $to_age)->where(DB::raw('DATE(import_fields.dos)'), '<=', $from_age);
                }
            }

            if (!empty($auditSearchValue['date']) && $auditSearchValue['date']['startDate'] != null) {
                $search_start_date = Carbon::createFromFormat('Y-m-d', $auditSearchValue['date']['startDate'])->startOfDay();
                $search_end_date = Carbon::createFromFormat('Y-m-d', $auditSearchValue['date']['endDate'])->endOfDay();

                $claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $search_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $search_end_date);
            }

            if (!empty($auditSearchValue['status_code']) && $auditSearchValue['status_code']['id'] != null) {
                $claim_data->where('status_code', '=', $auditSearchValue['status_code']['id']);
            }

            if (isset($auditSearchValue['patient_name']) && !empty($auditSearchValue['patient_name'])) {
                $claim_data->where('patient_name', 'LIKE', '%' . $auditSearchValue['patient_name'] . '%');
            }

            if (isset($auditSearchValue['total_charge']) && !empty($auditSearchValue['total_charge'])) {
                $claim_data->where('total_charges', $auditSearchValue['total_charge']);
            }

            if (isset($auditSearchValue['rendering_provider']) && !empty($auditSearchValue['rendering_provider'])) {
                $claim_data->where('rendering_prov', 'LIKE', '%' . $auditSearchValue['rendering_provider'] . '%');
            }

            if (isset($auditSearchValue['total_ar']) && !empty($auditSearchValue['total_ar'])) {
                $OriginalString = trim($auditSearchValue['total_ar']);
                $tot_ar = explode("-", $OriginalString);

                $min_tot_ar = $tot_ar[0] - 1.00;
                $max_tot_ar = $tot_ar[1];

                $claim_data->whereBetween('total_ar', [$min_tot_ar, $max_tot_ar]);
            }

            if (isset($auditSearchValue['responsibility']) && !empty($auditSearchValue['responsibility'])) {
                $claim_data->where('responsibility', 'LIKE', '%' . $auditSearchValue['responsibility'] . '%');
            }

            if (isset($auditSearchValue['denial_code']) && !empty($auditSearchValue['denial_code'])) {
                $claim_data->where('denial_code', $auditSearchValue['denial_code']);
            }

            if (isset($auditSearchValue['bill_submit_date']) && $auditSearchValue['bill_submit_date']['startDate'] != null) {
                $submit_start_date = Carbon::createFromFormat('Y-m-d', $auditSearchValue['bill_submit_date']['startDate'])->startOfDay();
                $submit_end_date = Carbon::createFromFormat('Y-m-d', $auditSearchValue['bill_submit_date']['endDate'])->endOfDay();

                $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $submit_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $submit_end_date);
            }

            $claim_data = $claim_data->get();
            $claim_count = $claim_data->count();

            if ($claim_data) {
                $claim_data = $this->arrange_claim_data($claim_data);
            }

            return response()->json([
                'data'  => $claim_data,
                'total' => $claim_count
            ]);
        } catch (Exception $e) {
            Log::debug('get audit table page Error. ' . $e->getMessage());
        }
    }



    protected function arrange_claim_data($claim_data)
    {

        foreach ($claim_data as $key => $value) {
            $dob = $claim_data[$key]['dos'];

            $from = DateTime::createFromFormat('m/d/Y', date('m/d/Y', strtotime($dob)));

            $to = date('d/m/Y');
            $to = new DateTime;
            $age = $to->diff($from);

            $claim_data[$key]['age'] = $age->days;
            $claim_data[$key]['touch'] = Claim_note::where('claim_id', $claim_data[$key]['claim_no'])->count();


            $getStatusCode = Statuscode::where('id', $claim_data[$key]['status_code'])->first();
            $getSubStatusCode = Sub_statuscode::where('id', $claim_data[$key]['substatus_code'])->first();
            $claim_data[$key]['statuscode'] = $getStatusCode->status_code ? $getStatusCode->status_code : 'NA';
            $claim_data[$key]['substatuscode'] = $getSubStatusCode->status_code ? $getSubStatusCode->status_code : 'NA';

            $assigned_data = Action::where('claim_id', $claim_data[$key]['claim_no'])->orderBy('created_at', 'desc')->first();
            if ($assigned_data != null) {
                $assigned_to = User::where('id', $assigned_data['assigned_to'])->pluck('firstname');
                $assigned_by = User::where('id', $assigned_data['assigned_by'])->pluck('firstname');

                $assignedTo_size = sizeOf($assigned_to);
                $assignedBy_size = sizeOf($assigned_by);

                $claim_data[$key]['assigned_to'] = $assignedTo_size ? $assigned_to[0] : 'NA';
                $claim_data[$key]['assigned_by'] = $assignedBy_size ? $assigned_by[0] : 'NA';

                $claim_data[$key]['created'] = date('d/m/Y', strtotime($assigned_data['created_at']));
            }
        }
        return $claim_data;
    }

    protected function arrange_claim_datas($claim_data)
    {

        foreach ($claim_data as $key => $value) {
            $dob = $claim_data[$key]['dos'];

            $from = DateTime::createFromFormat('m/d/Y', date('m/d/Y', strtotime($dob)));

            $to = date('d/m/Y');
            $to = new DateTime;
            $age = $to->diff($from);

            $claim_data[$key]['age'] = $age->days;
            $claim_data[$key]['touch'] = Claim_note::where('claim_id', $claim_data[$key]['claim_no'])->count();


            $assigned_data = Action::where('claim_id', $claim_data[$key]['claim_no'])->orderBy('created_at', 'desc')->first();
            if ($assigned_data != null) {
                $assigned_to = User::where('id', $assigned_data['assigned_to'])->pluck('firstname');
                $assigned_by = User::where('id', $assigned_data['assigned_by'])->pluck('firstname');

                $assignedTo_size = sizeOf($assigned_to);
                $assignedBy_size = sizeOf($assigned_by);

                $claim_data[$key]['assigned_to'] = $assignedTo_size ? $assigned_to[0] : 'NA';
                $claim_data[$key]['assigned_by'] = $assignedBy_size ? $assigned_by[0] : 'NA';

                $claim_data[$key]['created'] = date('d/m/Y', strtotime($assigned_data['created_at']));
            }
        }
        return $claim_data;
    }

    public function get_related_calims(LoginRequest $request)
    {

        $claim_id = $request->get('claim_no');
        $type = $request->get('type');
        $related_claims = [];
        if ($type == 'claim') {
            $related_claims = Import_field::where('acct_no', $claim_id['acct_no'])->where('claim_no', '<>', $claim_id['claim_no'])->get();

            return response()->json([
                'data'  => $related_claims
            ]);
        } else if ($type == 'followup') {
            $user = $request->get('user_id');
            // dd($claim_id);
            $related_data = Import_field::where('acct_no', $claim_id['acct_no'])->where('claim_no', '<>', $claim_id['claim_no'])->orderBy('updated_at', 'desc')->get();
            foreach ($related_data as $related) {
                $claim_stats = [];
                $claim_stats['claim'] = $related;
                if ($related['assigned_to'] == $user) {
                    $claim_stats['editable'] = true;
                } else {
                    $claim_stats['editable'] = false;
                }

                if (sizeOf($related_claims) < 3) {
                    array_push($related_claims, $claim_stats);
                } else {
                    break;
                }
            }
            return response()->json([
                'data'  => $related_claims
            ]);
        }
    }

    public function get_line_items(LoginRequest $request)
    {
        $claim_id = $request->get('claim_no');

        $related_claims = Line_item::select('line_items.*', 'import_fields.closed_claim_date')
            ->join('import_fields', 'line_items.claim_id', '=', 'import_fields.claim_no')
            ->where('line_items.claim_id', $claim_id)->get();

        return response()->json([
            'data'  => $related_claims
        ]);
    }




    /*To Retrieve Uploaded data from DB*/

    public function get_upload_table_page(LoginRequest $request)
    {
        try{

            $filedata = File_upload::orderBy('id', 'desc')->get();
            $latest = File_upload::orderBy('id', 'desc')->take(1)->first();
            return $filedata;
            if($filedata->isNotEmpty()) {
                $fileUploadData = [];
                $i = 0;

                foreach ($filedata as $fd) {
                    $date = explode(" ", $fd['report_date']);
                    $import = $fd['Import_by'];
                    $user = User::where('id', $import)->pluck('firstname');

                    if (sizeof($user) == 0) {
                        $user = "NA";
                    } else {
                        $user = $user[0];
                    }

                    $file_name_date = explode("_", $fd['file_name']);

                    $file_array = date("m/d/Y", strtotime($file_name_date[0]));

                    $file_array1 = $file_name_date[1];

                    foreach ($file_name_date as $key => $value) {
                        $file_name_date[0] = $file_array;
                        $file_name_date[1] = $file_array1;
                    }

                    $fd_file_name = implode('_', $file_name_date);

                    $fileUploadData[$i]['date'] = date("m/d/Y", strtotime($date[0]));
                    $fileUploadData[$i]['file_name'] = $fd_file_name;
                    $fileUploadData[$i]['id'] = $fd['id'];
                    $fileUploadData[$i]['claims'] =  $fd['total_claims'];
                    $fileUploadData[$i]['newclaims'] = $fd['new_claims'];
                    $fileUploadData[$i]['processed'] = $fd['claims_processed'];
                    $fileUploadData[$i]['uploaded'] = $user;
                    $fileUploadData[$i]['path'] = $fd['id'];
                    $fileUploadData[$i]['notes'] = $fd['notes'];
                    $i++;
                }

                return response()->json([
                    'message' => $fileUploadData,
                    'latest_id' => $latest['id'],
                    'error' => "Upload Complete"
                ]);
            }else {
                return response()->json([
                    'message' => [],
                    'latest_id' => '',
                    'error' => "No Data Found"
                ]);
            }

        }catch (Exception $e) {
            Log::debug('get upload table page Exception Error :' . $e->getMessage());
            throw new Exception('get upload table page Exception Error :' . $e->getMessage());
        }

    }

    public function fetch_export_data(LoginRequest $request)
    {

        $filter = $request->get('filter');
        $status_code = $request->get('status');
        $user_id = $request->get('user');


        /*The Values of User role and status code must be changed */

        //   $status_code= Statuscode::where('description','like', '%' . 'Client Assistance' . '%')->get();

        $user_role = User::where('id', $user_id)->pluck('role_id');

        $claim_data = Import_field::orderBy('id', 'asc')->get();



        foreach ($claim_data as $key => $claim) {
            $dob = $claim_data[$key]['created_at'];
            // $claim_age = Carbon::parse($dob)->age;
            $claim_age = $dob->diff(Carbon::now())->format('%d');
            $claim_data[$key]['claim_age'] = $claim_age;
            if ($claim['status_code'] == null) {
                $claim_data[$key]['status_code'] = "NA";
            } else {
                $status_code = Statuscode::where('id', $claim['status_code'])->get();
                $claim_data[$key]['status_code'] = $status_code[0]['status_code'] . "-" . $status_code[0]['description'];
            }

            $assigned_data = Action::where('claim_id', $claim_data[$key]['claim_no'])->orderBy('created_at', 'desc')->first();

            if ($assigned_data != null) {
                $assigned_to = User::where('id', $assigned_data['assigned_to'])->pluck('firstname');
                $assigned_by = User::where('id', $assigned_data['assigned_by'])->pluck('firstname');
                $claim_data[$key]['assigned_to_name'] = $assigned_to[0];
                $claim_data[$key]['assigned_by_name'] = $assigned_by[0];
                $claim_data[$key]['assigned_date'] = date('d/m/Y', strtotime($assigned_data['created_at']));
            } else {
                $claim_data[$key]['assigned_to_name'] = 'NA';
                $claim_data[$key]['assigned_by_name'] = 'NA';
                $claim_data[$key]['assigned_date'] = 'NA';
            }

            $claim_data[$key]['touch'] = Claim_note::where('claim_id', $claim['claim_no'])->count();
        }

        return response()->json([
            'data'  => $claim_data
        ]);
    }

    public function delete_upload_file(LoginRequest $request)
    {
        $user = $request->get('user_id');
        $file_id = $request->get('file_id');


        $deleted_id = File_upload::where('id', $file_id)->where('claims_processed', 0)->first();


        if ($deleted_id != null) {

            $file_delete = File_upload::where('id', $deleted_id['id'])->delete();
            $message = 'success';
        } else {

            $file_delete = 'Not able to delete file';
            $message = 'failure';
        }


        return response()->json([
            'data'  => $file_delete, 'message' => $message
        ]);
    }

    public function process_upload_file(LoginRequest $request)
    {
        // $form_data=$request->get('formData');
        //      $user=$form_data['user_id'];
        // $file_id=$request->get('file_id');
        $user = $request->get('user_id');
        $file_id = $request->get('file_id');
        $practice_dbid = $request->get('practice_dbid');
        $file_data = File_upload::where('id', $file_id)->get();
        $op_data = $this->file_processor($file_data[0]['file_name'], NUll, NULL, $user, $file_data[0]['unique_name'], $practice_dbid);

        //dd($op_data);

        return response()->json([
            'message'  => $op_data
        ]);
    }


    protected function file_processor($filename, $report_date, $notes, $user, $unique_name, $practice_dbid)
    {

        $display_data = [];
        $mismatch_data = [];
        $duplicate_data = [];
        $new_data = [];
        $duplicate_details = [];
        $newdata = [];

        $duplicate_filter = [];
        $new_filter = [];
        $new_filter_data = [];


        $duplicate_record = 0;
        $new_record = 0;
        $mismatch_record = 0;
        $total_records = 0;
        $mismat_monitor = [];

        $upd_line_items = [];


        $path = "uploads/" . $unique_name;

        // $data = Excel::load($path, function ($reader) {
        // })->get();
        $data = [];
        // dd($data);
        $count = 1;
        $array = $data;

        //dd($array);

        $present_data = Config::get('fields.data');
        $op_array = [];



        foreach ($present_data as $key => $value) {
            $op_array[$value] = NULL;
            //   dd($value);

            if ($value == 'dos' || $value == 'dob' || $value == 'admit_date' || $value == 'discharge_date') {
                $op_array[$value] = '0000';
            }
        }

        $destinationPath = public_path('../config/test/test.txt');
        $jsondec = json_decode(file_get_contents($destinationPath), true);
        $jsonindex = array_keys($jsondec);
        /*Handle names*/
        //   $destinationPath=public_path('../config/fields.txt');
        $field_value = Config::get('fields.data');

        $field_keys = [];

        foreach ($jsonindex as $json) {
            $value = $field_value[$json];
            array_push($jsonindex, $value);
            array_push($field_keys, $json);
        }


        $name_destinationPath = public_path('../config/test/fields_name.txt');
        $name_jsondec = json_decode(file_get_contents($name_destinationPath), true);

        foreach ($name_jsondec as $key => $value) {
            $value = strtolower($value);
            $value_changeds = str_replace(" ", "_", $value);
            $value_changed = str_replace("/", "", $value_changeds);
            $name_jsondec[$key] = $value_changed;
        }
        //   $name_jsonindex = array_keys($name_jsondec);


        foreach ($array as $val) {

            $index_ip = array_keys($val);

            if ($val['claim_no'] != null) {

                /*To Change Name from Upload DOC to work name*/
                $name_changed = [];
                $i = 1;

                foreach ($name_jsondec as $key => $value) {
                    $index_ip = array_filter($index_ip);

                    // dd($index_ip);
                    // if($i==3)
                    // {
                    //     dd($value,$index_ip,array_find($value,$index_ip));
                    // }

                    if (in_array($value, $index_ip)) {

                        $name_changed[$key] = $val[$value];
                        $i++;
                    }
                }

                $val = $name_changed;

                $index_ip = array_keys($val);
                //dd($index_ip);
                $count_ip = count($index_ip);
                //dd($count_ip);
                $index_present = array_keys($present_data);
                //dd($index_present);

                for ($i = 0; $i < $count_ip; $i++) {
                    //print_r($index_present); echo "</br>";
                    if (in_array($index_ip[$i], $index_present)) {
                        if ($val[$index_ip[$i]] == NULL) {
                            $op_array[$present_data[$index_ip[$i]]] = NULL;
                        } else if (is_object($val[$index_ip[$i]]) == true) {
                            $op_array[$present_data[$index_ip[$i]]] = $val[$index_ip[$i]]->format('m/d/Y');
                        } else {
                            $op_array[$present_data[$index_ip[$i]]] = $val[$index_ip[$i]];
                            //print_r($op_array[$present_data[$index_ip[$i]]]);
                        }
                    }
                }
                //      $op_array['file_upload_id']=$file_upload['id'];

                // DO the Process Work HERE**********

                //dd($op_array['claim_no']);
                $check_duplicate = Import_field::where('claim_no', $op_array['claim_no'])->count();
                //dd($check_duplicate);

                if ($check_duplicate != 0) {
                    if (!in_array($op_array['claim_no'], $duplicate_filter)) {
                        $duplicate_record++;
                        $total_records++;
                        array_push($duplicate_filter, $op_array['claim_no']);
                    }

                    array_push($duplicate_data, $op_array['claim_no']);

                    //dd($duplicate_data);

                    //dd($op_array['claim_no']);

                    $mismatch = Import_field::where('claim_no', $op_array['claim_no'])->first()->toArray();

                    $mismat_data = $mismatch;




                    $tableFieldArr = [];
                    //dd($mismat_data);
                    foreach ($mismat_data as $key => $value) {
                        // 'total_charges' => $value['total_charges'],
                        if ($key == 'total_charges') {
                            if (!empty($value)) {
                                // $tableFieldArr['total_charges'] = number_format($value, 2);
                                $tableFieldArr['total_charges'] = trim($value);
                            }
                        } else if ($key == 'pat_ar') {
                            if (!empty($value)) {
                                $tableFieldArr['pat_ar'] = trim($value);
                            }
                        } else if ($key == 'ins_ar') {
                            if (!empty($value)) {
                                $tableFieldArr['ins_ar'] = trim($value);
                            }
                        } else if ($key == 'address_1') {
                            $tableFieldArr['address_line_1'] = trim($value);
                        } else if ($key == 'address_2') {
                            $tableFieldArr['address_line_2'] = trim($value);
                        } else if ($key == 'prim_ins_name') {
                            $tableFieldArr['primary_insurance_name'] = trim($value);
                            //print_r($tableFieldArr['primary_insurance_name']);
                        } else if ($key == 'prim_pol_id') {
                            $tableFieldArr['primary_policy_id'] = trim($value);
                        } else if ($key == 'prim_group_id') {
                            $tableFieldArr['primary_group_id'] = trim($value);
                        } else if ($key == 'prim_address_1') {
                            $tableFieldArr['primary_insurance_address_line_1'] = trim($value);
                        } else if ($key == 'prim_address_2') {
                            $tableFieldArr['primary_insurance_address_line_2'] = trim($value);
                        } else if ($key == 'prim_city') {
                            $tableFieldArr['primary_insurance_city'] = trim($value);
                        } else if ($key == 'prim_state') {
                            $tableFieldArr['primary_insurance_state'] = trim($value);
                        } else if ($key == 'prim_zipcode') {
                            $tableFieldArr['primary_insurance_zipcode'] = trim($value);
                        } else if ($key == 'sec_ins_name') {
                            $tableFieldArr['secondary_insurance_name'] = trim($value);
                        } else if ($key == 'sec_pol_id') {
                            $tableFieldArr['secondary_policy_id'] = trim($value);
                        } else if ($key == 'sec_group_id') {
                            $tableFieldArr['secondary_group_id'] = trim($value);
                        } else if ($key == 'sec_address_1') {
                            $tableFieldArr['secondary_insurance_address_line_1'] = trim($value);
                        } else if ($key == 'sec_address_2') {
                            $tableFieldArr['secondary_insurance_address_line_2'] = trim($value);
                        } else if ($key == 'sec_city') {
                            $tableFieldArr['secondary_insurance_city'] = trim($value);
                        } else if ($key == 'sec_state') {
                            $tableFieldArr['secondary_insurance_state'] = trim($value);
                        } else if ($key == 'sec_zipcode') {
                            $tableFieldArr['secondary_insurance_zipcode'] = trim($value);
                        } else if ($key == 'ter_ins_name') {
                            $tableFieldArr['tertiary_insurance_name'] = trim($value);
                        } else if ($key == 'ter_pol_id') {
                            $tableFieldArr['tertiary_policy_id'] = trim($value);
                        } else if ($key == 'ter_group_id') {
                            $tableFieldArr['tertiary_group_id'] = trim($value);
                        } else if ($key == 'ter_address_1') {
                            $tableFieldArr['tertiary_insurance_address_line_1'] = trim($value);
                        } else if ($key == 'ter_address_2') {
                            $tableFieldArr['tertiary_insurance_address_line_2'] = trim($value);
                        } else if ($key == 'ter_city') {
                            $tableFieldArr['tertiary_insurance_city'] = trim($value);
                        } else if ($key == 'ter_state') {
                            $tableFieldArr['tertiary_insurance_state'] = trim($value);
                        } else if ($key == 'ter_zipcode') {
                            $tableFieldArr['tertiary_insurance_zipcode'] = trim($value);
                        } else if ($key == 'auth_no') {
                            $tableFieldArr['authorization'] = trim($value);
                        } else if ($key == 'rendering_prov') {
                            $tableFieldArr['rendering_provider'] = trim($value);
                        } else if ($key == 'billing_prov') {
                            $tableFieldArr['billing_provider'] = trim($value);
                        } else if ($key == 'claim_note') {
                            $tableFieldArr['claim_note'] = trim($value);
                        } else if ($key == 'denial_code') {
                            $tableFieldArr['denial_code'] = trim($value);
                        } else
                            $tableFieldArr[$key] = trim($value);
                    }
                    // exit();

                    //dd($op_array);

                    foreach ($op_array as $key => $value) {
                        // \Log::info($key . '------' . $value);
                        if ($key == 'acct_no') {
                            if (!empty($op_array['acct_no'])) {
                                $op_array['acct_no'] = trim($value);
                            }
                        }

                        if ($key == 'claim_no') {
                            if (!empty($op_array['claim_no'])) {
                                $op_array['claim_no'] = trim($value);
                            }
                        }

                        if ($key == 'patient_name') {
                            if (!empty($op_array['patient_name'])) {
                                $op_array['patient_name'] = trim($value);
                            }
                        }

                        if ($key == 'gender') {
                            if (!empty($op_array['gender'])) {
                                $op_array['gender'] = trim($value);
                            }
                        }

                        if ($key == 'address_line_1') {
                            if (!empty($op_array['address_line_1'])) {
                                $op_array['address_line_1'] = trim($value);
                            }
                        }

                        if ($key == 'address_line_2') {
                            if (!empty($op_array['address_line_2'])) {
                                $op_array['address_line_2'] = trim($value);
                            }
                        }

                        if ($key == 'city') {
                            if (!empty($op_array['city'])) {
                                $op_array['city'] = trim($value);
                            }
                        }

                        if ($key == 'state') {
                            if (!empty($op_array['state'])) {
                                $op_array['state'] = trim($value);
                            }
                        }

                        if ($key == 'zipcode') {
                            if (!empty($op_array['zipcode'])) {
                                $op_array['zipcode'] = trim($value);
                            }
                        }

                        if ($key == 'guarantor') {
                            if (!empty($op_array['guarantor'])) {
                                $op_array['guarantor'] = trim($value);
                            }
                        }

                        if ($key == 'employer') {
                            if (!empty($op_array['employer'])) {
                                $op_array['employer'] = trim($value);
                            }
                        }

                        if ($key == 'responsibility') {
                            if (!empty($op_array['responsibility'])) {
                                $op_array['responsibility'] = trim($value);
                            }
                        }

                        if ($key == 'insurance_type') {
                            if (!empty($op_array['insurance_type'])) {
                                $op_array['insurance_type'] = trim($value);
                            }
                        }

                        if ($key == 'primary_insurance_name') {
                            if (!empty($op_array['primary_insurance_name'])) {
                                $op_array['primary_insurance_name'] = trim($value);
                            }
                        }

                        if ($key == 'primary_policy_id') {
                            if (!empty($op_array['primary_policy_id'])) {
                                $op_array['primary_policy_id'] = trim($value);
                            }
                        }

                        if ($key == 'primary_group_id') {
                            if (!empty($op_array['primary_group_id'])) {
                                $op_array['primary_group_id'] = trim($value);
                            }
                        }

                        if ($key == 'primary_insurance_address_line_1') {
                            if (!empty($op_array['primary_insurance_address_line_1'])) {
                                $op_array['primary_insurance_address_line_1'] = trim($value);
                            }
                        }

                        if ($key == 'primary_insurance_address_line_2') {
                            if (!empty($op_array['primary_insurance_address_line_2'])) {
                                $op_array['primary_insurance_address_line_2'] = trim($value);
                            }
                        }

                        if ($key == 'primary_insurance_city') {
                            if (!empty($op_array['primary_insurance_city'])) {
                                $op_array['primary_insurance_city'] = trim($value);
                            }
                        }


                        if ($key == 'primary_insurance_state') {
                            if (!empty($op_array['primary_insurance_state'])) {
                                $op_array['primary_insurance_state'] = trim($value);
                            }
                        }

                        if ($key == 'primary_insurance_zipcode') {
                            if (!empty($op_array['primary_insurance_zipcode'])) {
                                $op_array['primary_insurance_zipcode'] = trim($value);
                            }
                        }

                        if ($key == 'secondary_insurance_name') {
                            if (!empty($op_array['secondary_insurance_name'])) {
                                $op_array['secondary_insurance_name'] = trim($value);
                            }
                        }

                        if ($key == 'secondary_policy_id') {
                            if (!empty($op_array['secondary_policy_id'])) {
                                $op_array['secondary_policy_id'] = trim($value);
                            }
                        }

                        if ($key == 'secondary_group_id') {
                            if (!empty($op_array['secondary_group_id'])) {
                                $op_array['secondary_group_id'] = trim($value);
                            }
                        }

                        if ($key == 'secondary_insurance_address_line_1') {
                            if (!empty($op_array['secondary_insurance_address_line_1'])) {
                                $op_array['secondary_insurance_address_line_1'] = trim($value);
                            }
                        }

                        if ($key == 'secondary_insurance_address_line_2') {
                            if (!empty($op_array['secondary_insurance_address_line_2'])) {
                                $op_array['secondary_insurance_address_line_2'] = trim($value);
                            }
                        }

                        if ($key == 'secondary_insurance_city') {
                            if (!empty($op_array['secondary_insurance_city'])) {
                                $op_array['secondary_insurance_city'] = trim($value);
                            }
                        }

                        if ($key == 'secondary_insurance_state') {
                            if (!empty($op_array['secondary_insurance_state'])) {
                                $op_array['secondary_insurance_state'] = trim($value);
                            }
                        }

                        if ($key == 'secondary_insurance_zipcode') {
                            if (!empty($op_array['secondary_insurance_zipcode'])) {
                                $op_array['secondary_insurance_zipcode'] = trim($value);
                            }
                        }

                        if ($key == 'tertiary_insurance_name') {
                            if (!empty($op_array['tertiary_insurance_name'])) {
                                $op_array['tertiary_insurance_name'] = trim($value);
                            }
                        }

                        if ($key == 'tertiary_policy_id') {
                            if (!empty($op_array['tertiary_policy_id'])) {
                                $op_array['tertiary_policy_id'] = trim($value);
                            }
                        }

                        if ($key == 'tertiary_group_id') {
                            if (!empty($op_array['tertiary_group_id'])) {
                                $op_array['tertiary_group_id'] = trim($value);
                            }
                        }

                        if ($key == 'tertiary_insurance_address_line_1') {
                            if (!empty($op_array['tertiary_insurance_address_line_1'])) {
                                $op_array['tertiary_insurance_address_line_1'] = trim($value);
                            }
                        }

                        if ($key == 'tertiary_insurance_address_line_2') {
                            if (!empty($op_array['tertiary_insurance_address_line_2'])) {
                                $op_array['tertiary_insurance_address_line_2'] = trim($value);
                            }
                        }

                        if ($key == 'tertiary_insurance_city') {
                            if (!empty($op_array['tertiary_insurance_city'])) {
                                $op_array['tertiary_insurance_city'] = trim($value);
                            }
                        }

                        if ($key == 'tertiary_insurance_state') {
                            if (!empty($op_array['tertiary_insurance_state'])) {
                                $op_array['tertiary_insurance_state'] = trim($value);
                            }
                        }

                        if ($key == 'tertiary_insurance_zipcode') {
                            if (!empty($op_array['tertiary_insurance_zipcode'])) {
                                $op_array['tertiary_insurance_zipcode'] = trim($value);
                            }
                        }

                        if ($key == 'authorization') {
                            if (!empty($op_array['authorization'])) {
                                $op_array['authorization'] = trim($value);
                            }
                        }

                        if ($key == 'rendering_provider') {
                            if (!empty($op_array['rendering_provider'])) {
                                $op_array['rendering_provider'] = trim($value);
                            }
                        }

                        if ($key == 'billing_provider') {
                            if (!empty($op_array['billing_provider'])) {
                                $op_array['billing_provider'] = trim($value);
                            }
                        }

                        if ($key == 'facility') {
                            if (!empty($op_array['facility'])) {
                                $op_array['facility'] = trim($value);
                            }
                        }

                        if ($key == 'modifiers') {
                            if (!empty($op_array['modifiers'])) {
                                $op_array['modifiers'] = trim($value);
                            }
                        }

                        if ($key == 'units') {
                            if (!empty($op_array['units'])) {
                                $op_array['units'] = trim($value);
                            }
                        }

                        if ($key == 'icd') {
                            if (!empty($op_array['icd'])) {
                                $op_array['icd'] = trim($value);
                            }
                        }

                        if ($key == 'claim_Status') {
                            if (!empty($op_array['claim_Status'])) {
                                $op_array['claim_Status'] = trim($value);
                            }
                        }

                        if ($key == 'claim_note') {
                            if (!empty($op_array['claim_note'])) {
                                $op_array['claim_note'] = trim($value);
                            }
                        }









                        if ($key == 'dos') {
                            if ($op_array['dos'] == 0) {
                                $op_array['dos'] = '';
                            } else {
                                $values = trim($value);
                                $op_array['dos'] = date('Y-m-d', strtotime($values));
                            }
                        }
                        if ($key == 'dob') {
                            if ($op_array['dob'] == 0) {
                                $op_array['dob'] = '';
                            } else {
                                $values = trim($value);
                                $op_array['dob'] = date('Y-m-d', strtotime($values));
                            }
                        }
                        if ($key == 'admit_date') {
                            if ($op_array['admit_date'] == 0) {
                                $op_array['admit_date'] = '';
                            } else {
                                $values = trim($value);
                                $op_array['admit_date'] = date('Y-m-d', strtotime($values));
                            }
                        }

                        if ($key == 'discharge_date') {
                            if ($op_array['discharge_date'] == 0) {
                                $op_array['discharge_date'] = '';
                            } else {
                                $values = trim($value);
                                $op_array['discharge_date'] = date('Y-m-d', strtotime($values));
                            }
                        }



                        if ($key == 'pat_ar') {
                            if (!empty($value)) {
                                $op_array['pat_ar'] = trim(number_format($value, 2));
                            }
                        }

                        if ($key == 'total_charges') {
                            if (!empty($value)) {
                                $values = trim($value);
                                $op_array['total_charges'] = number_format($values, 2);
                            }
                        }

                        if ($key == 'ins_ar') {
                            if (!empty($value)) {
                                $values = trim($value);
                                $op_array['ins_ar'] = number_format($values, 2);
                            }
                        }

                        if ($key == 'billedlast_submit_date') {
                            if ($op_array['billedlast_submit_date'] == 0) {
                                $op_array['billedlast_submit_date'] = '';
                            } else {
                                $values = trim($value);
                                $op_array['billedlast_submit_date'] = date('Y-m-d', strtotime($values));
                            }
                        }

                        if ($key == 'denial_code') {
                            if (!empty($op_array['denial_code'])) {
                                $op_array['denial_code'] = trim($value);
                            }
                        }

                        // if($key == 'total_ar'){
                        //     $op_array['total_ar'] = number_format($value, 2);
                        // }

                    }
                    $difference = array_diff($op_array, $mismatch);
                    //dd($difference);
                    $key_diff = array_keys($difference);
                    //dd($key_diff);
                    //   $display_data['test_data']=$op_array;
                    //   $display_data['test_data1']=$difference;
                    //   $display_data['test_data2']=$key_diff;

                    //Mismatched Claims must be Differentiated Here
                    $mismatch = 0;

                    /*Exceptions       */
                    $exception = ['total_ar_due', 'ins_ar', 'units', 'modifier', 'icd', 'cpt', 'dos', 'billedlast_submit_date'];
                    foreach ($key_diff as $diff) {
                        if (in_array($diff, $jsonindex)) {

                            // array_push($jsonindex,$value);
                            // array_push($field_keys,$json);

                            $key = array_search($diff, $field_keys);
                            $diff_pass = $jsonindex[$key];


                            if ($jsondec[$diff_pass][1] == 'notify') {

                                /* Due to Line Items */
                                if (!in_array($diff, $exception)) {
                                    $mismatch++;

                                    //dd($tableFieldArr[$diff]);

                                    $mismatch_data[$op_array['claim_no']]['midb'][$diff] = $tableFieldArr[$diff];
                                    $mismatch_data[$op_array['claim_no']]['mupd'][$diff] = $op_array[$diff];
                                    //dd($mismatch_data[$op_array['claim_no']]['mupd'][$diff]);
                                }
                            }
                        }
                    }
                    if ($mismatch > 0 && !in_array($op_array['claim_no'], $mismat_monitor)) {
                        // dd($mismat_monitor);
                        // dd($op_array['claim_no']);
                        $mismatch_record++;
                        // dd($mismatch_record++);
                        array_push($mismat_monitor, $op_array['claim_no']);

                        //dd($mismat_monitor);
                    }

                    $display_data['mismatch_data'] = $mismatch_data;
                    // print_r($display_data['mismatch_data']);
                    $display_data['duplicate_data'] = $duplicate_data;
                    $display_data['duplicate_filter'] = $duplicate_filter;



                    /*Update Line Items Part - 1*/

                    $upd_monitor = [];
                    array_push($upd_line_items, $op_array);

                    if (!in_array($op_array['claim_no'], $upd_monitor)) {
                        //dd($op_array['claim_no']);
                        array_push($upd_monitor, $op_array['claim_no']);
                        DB::table('line_items')->where('claim_id', $op_array['claim_no'])->delete();
                    }
                    //Update Line Items EOP - 1
                } else {

                    if (!in_array($op_array['claim_no'], $new_filter)) {
                        $total_records++;
                        $new_record++;
                        array_push($new_filter, $op_array['claim_no']);
                        array_push($new_filter_data, $op_array);
                    }


                    array_push($new_data, $op_array['claim_no']);
                    array_push($newdata, $op_array);
                    // $newdata[$op_array['claim_no']]=$op_array;
                    $display_data['mismatch_data'] = [];
                    $display_data['duplicate_data'] = [];
                    $display_data['duplicate_filter'] = [];
                }
                $display_data['new_data'] =  $new_data;
                $display_data['new_datas'] =  $newdata;
                $display_data['new_filter'] = $new_filter;
                $display_data['new_filter_data'] = $new_filter_data;
                $display_data['mismatch_nos'] = $mismatch_record;
                //dd($display_data['mismatch_nos']);


                //   $display_data['test_data3']=$difference;

                //Import+field data Insert Code
                /*$import=Import_field::create(
                                      $op_array
                                );*/
            }
        }


        /*Line items Update Code contd...*/



        if (sizeof($upd_line_items) != 0) {
            foreach ($upd_line_items as $update) {
                $import_line = Line_item::create(
                    array(
                        'claim_id'          => $update['claim_no'],
                        'total_ar_due'      => $update['total_ar'],
                        'ins_ar'            => $update['ins_ar'],
                        'pat_ar'            => $update['pat_ar'],
                        'units'             => $update['units'],
                        'modifier'          => $update['modifiers'],
                        'icd'               => $update['icd'],
                        'cpt'               => $update['cpt'],
                        'dos'               => $update['dos']
                    )
                );
            }
        }

        /*Get Fields Name*/

        // $field_name= Config::get('names');
        // $display_data['field_name'] = $field_name;

        // $destination=public_path('../config/names.txt');
        // $field_name = json_decode(file_get_contents($destination) , true);


        $field_name = [
            "acct_no" => "Account Number",
            "claim_no" => "Claim Number",
            "patient_name" => "Patient Name",
            "dos" => "DOS",
            "dob" => "DOB",
            "ssn" => "SSN",
            "gender" => "Gender",
            "phone_no" => "Phone Number",
            "address_1" => "Address 1",
            "address_2" => "Address 2",
            "city" => "City",
            "state" => "State",
            "zipcode" => "Zip Code",
            "guarantor" => "Guarantor",
            "employer" => "Employer",
            "responsibility" => "Responsibility",
            "insurance_type" => "Insurance Type",
            "prim_ins_name" => "Primary Insurance Name",
            "prim_pol_id" => "Primary Policy ID",
            "prim_group_id" => "Primary Group ID",
            "prim_address_1" => "Primary Address 1",
            "prim_address_2" => "Primary Address 2",
            "prim_city" => "Primary City",
            "prim_state" => "Primary State",
            "prim_zipcode" => "Primary Zip Code",
            "sec_ins_name" => "Secondary Insurance Name",
            "sec_pol_id" => "Secondary Policy ID",
            "sec_group_id" => "Secondary Group ID",
            "sec_address_1" => "Secondary Address 1",
            "sec_address_2" => "Secondary Address 2",
            "sec_city" => "Secondary City",
            "sec_state" => "Secondary State",
            "sec_zipcode" => "Secondary Zip Code",
            "ter_ins_name" => "Tertiary Insurance Name",
            "ter_pol_id" => "Tertiary Policy ID",
            "ter_group_id" => "Tertiary Group ID",
            "ter_address_1" => "Tertiary Address 1",
            "ter_address_2" => "Tertiary Address 2",
            "ter_city" => "Tertiary City",
            "ter_state" => "Tertiary State",
            "ter_zipcode" => "Tertiary Zip Code",
            "auth_no" => "Authentication Number",
            "rendering_prov" => "Rendering Provider",
            "billing_prov" => "Billing Provider",
            "facility" => "Facility",
            "admit_date" => "Admit Date",
            "discharge_date" => "Discharge Date",
            "cpt" => "CPT",
            "icd" => "ICD",
            "modifiers" => "Modifiers",
            "units" => "Units",
            "total_charges" => "Total Charges",
            "pat_ar" => "Patient AR",
            "ins_ar" => "Insurance AR",
            "total_ar" => "Total AR",
            "claim_Status" => "Claim Status",
            "claim_note" => "Claim Note",
            "billedlast_submit_date" => "Billed/Last Submit Date",
            "denial_code" => "Denial Code"

        ];

        $display_data['field_name'] = $field_name;

        // $display_data['Test']=$upd_line_items;




        //Insert code for 'file_uploads' Table

        $upload_check = File_upload::where('file_name', $filename)->first();


        //Check Values
        if ($report_date != NULL) {
            $date = $report_date;
            $date = date('Y-m-d h:i:s', strtotime($date));

            $file_upload = File_upload::create(
                [
                    'report_date'         => $date, //
                    'file_name'           => $filename,
                    'unique_name'         => $unique_name,
                    'file_url'            => $path,
                    'notes'               => $notes,
                    'total_claims'        => $total_records,
                    'new_claims'          => $new_record,
                    'Import_by'           => $user,
                    'claims_processed'    => '0',
                    'status'              => 'Incomplete',
                    'deleted_at'          => '2018-09-25 09:30:57'
                ]
            );
            $display_data['filedata'] = $file_upload;
        } else {
            $display_data['filedata'] = $upload_check;
        }

        $uploaded_by = User::where('id', $display_data['filedata']['Import_by'])->pluck('firstname');

        $display_data['filedata']['uploaded'] = $uploaded_by[0];
        return $display_data;
    }





    protected function file_processors($filename, $report_date, $notes, $user, $unique_name, $practice_dbid)
    {

        $display_data = [];
        $mismatch_data = [];
        $duplicate_data = [];
        $new_data = [];
        $duplicate_details = [];
        $newdata = [];

        $duplicate_filter = [];
        $new_filter = [];
        $new_filter_data = [];


        $duplicate_record = 0;
        $new_record = 0;
        $mismatch_record = 0;
        $total_records = 0;
        $mismat_monitor = [];

        $upd_line_items = [];


        $path = "uploads/" . $unique_name;
        // $data = Excel::load($path, function ($reader) {
        // })->get();
        $data = [];


        $count = 1;
        $array = $data;

        $present_data = Config::get('fields.data');
        $op_array = [];

        foreach ($present_data as $key => $value) {
            $op_array[$value] = NULL;
            //   dd($value);

            if ($value == 'dos' || $value == 'dob' || $value == 'admit_date' || $value == 'discharge_date') {
                $op_array[$value] = '0000';
            }
        }

        $destinationPath = public_path('../config/test/test.txt');
        $jsondec = json_decode(file_get_contents($destinationPath), true);
        //dd($jsondec);
        $jsonindex = array_keys($jsondec);
        /*Handle names*/
        //   $destinationPath=public_path('../config/fields.txt');
        $field_value = Config::get('fields.data');

        $field_keys = [];

        foreach ($jsonindex as $json) {
            $value = $field_value[$json];
            array_push($jsonindex, $value);
            array_push($field_keys, $json);
        }


        $name_destinationPath = public_path('../config/test/fields_name.txt');
        $name_jsondec = json_decode(file_get_contents($name_destinationPath), true);

        foreach ($name_jsondec as $key => $value) {
            $value = strtolower($value);
            $value_changeds = str_replace(" ", "_", $value);
            $value_changed = str_replace("/", "", $value_changeds);
            $name_jsondec[$key] = $value_changed;
        }
        //   $name_jsonindex = array_keys($name_jsondec);


        foreach ($array as $val) {

            $index_ip = array_keys($val);

            if ($val['claim_no'] != null) {

                /*To Change Name from Upload DOC to work name*/
                $name_changed = [];
                $i = 1;
                // dd($name_jsondec);
                foreach ($name_jsondec as $key => $value) {
                    $index_ip = array_filter($index_ip);

                    // dd($index_ip);
                    // if($i==3)
                    // {
                    //     dd($value,$index_ip,array_find($value,$index_ip));
                    // }

                    if (in_array($value, $index_ip)) {

                        $name_changed[$key] = $val[$value];
                        $i++;
                    }
                }

                $val = $name_changed;

                $index_ip = array_keys($val);
                // dd($index_ip);
                $count_ip = count($index_ip);
                // dd($count_ip);
                $index_present = array_keys($present_data);
                // dd($index_present);

                for ($i = 0; $i < $count_ip; $i++) {
                    //print_r($index_present); echo "</br>";
                    if (in_array($index_ip[$i], $index_present)) {
                        if ($val[$index_ip[$i]] == NULL) {
                            $op_array[$present_data[$index_ip[$i]]] = NULL;
                        } else if (is_object($val[$index_ip[$i]]) == true) {
                            $op_array[$present_data[$index_ip[$i]]] = $val[$index_ip[$i]]->format('m/d/Y');
                        } else {
                            $op_array[$present_data[$index_ip[$i]]] = $val[$index_ip[$i]];
                            // print_r($op_array[$present_data[$index_ip[$i]]]);
                        }
                    }
                }
                //      $op_array['file_upload_id']=$file_upload['id'];

                // DO the Process Work HERE**********

                //dd($op_array['claim_no']);
                $check_duplicate = Import_field::where('claim_no', $op_array['claim_no'])->count();
                //dd($check_duplicate);

                if ($check_duplicate != 0) {
                    if (!in_array($op_array['claim_no'], $duplicate_filter)) {
                        $duplicate_record++;
                        $total_records++;
                        array_push($duplicate_filter, $op_array['claim_no']);
                    }

                    array_push($duplicate_data, $op_array['claim_no']);

                    //dd($duplicate_data);

                    //dd($op_array['claim_no']);

                    $mismatch = Import_field::where('claim_no', $op_array['claim_no'])->first()->toArray();

                    $mismat_data = $mismatch;




                    $tableFieldArr = [];
                    //dd($mismat_data);
                    foreach ($mismat_data as $key => $value) {
                        // 'total_charges' => $value['total_charges'],
                        if ($key == 'total_charges') {
                            if (!empty($value)) {
                                $tableFieldArr['total_charges'] = trim(number_format((float)$value, 2, '.', ''));
                                // $tableFieldArr['total_charges'] = trim($value);
                            }
                        } else if ($key == 'pat_ar') {
                            if (!empty($value)) {
                                $tableFieldArr['pat_ar'] = trim(number_format((float)$value, 2, '.', ''));
                            }
                        } else if ($key == 'ins_ar') {
                            if (!empty($value)) {
                                $tableFieldArr['ins_ar'] = trim(number_format((float)$value, 2, '.', ''));
                            }
                        } else if ($key == 'total_ar') {
                            if (!empty($value)) {
                                $tableFieldArr['total_ar'] = trim(number_format((float)$value, 2, '.', ''));
                            }
                        } else if ($key == 'address_1') {
                            $tableFieldArr['address_line_1'] = trim($value);
                        } else if ($key == 'address_2') {
                            $tableFieldArr['address_line_2'] = trim($value);
                        } else if ($key == 'prim_ins_name') {
                            $tableFieldArr['primary_insurance_name'] = trim($value);
                            //print_r($tableFieldArr['primary_insurance_name']);
                        } else if ($key == 'prim_pol_id') {
                            $tableFieldArr['primary_policy_id'] = trim($value);
                        } else if ($key == 'prim_group_id') {
                            $tableFieldArr['primary_group_id'] = trim($value);
                        } else if ($key == 'prim_address_1') {
                            $tableFieldArr['primary_insurance_address_line_1'] = trim($value);
                        } else if ($key == 'prim_address_2') {
                            $tableFieldArr['primary_insurance_address_line_2'] = trim($value);
                        } else if ($key == 'prim_city') {
                            $tableFieldArr['primary_insurance_city'] = trim($value);
                        } else if ($key == 'prim_state') {
                            $tableFieldArr['primary_insurance_state'] = trim($value);
                        } else if ($key == 'prim_zipcode') {
                            $tableFieldArr['primary_insurance_zipcode'] = trim($value);
                        } else if ($key == 'sec_ins_name') {
                            $tableFieldArr['secondary_insurance_name'] = trim($value);
                        } else if ($key == 'sec_pol_id') {
                            $tableFieldArr['secondary_policy_id'] = trim($value);
                        } else if ($key == 'sec_group_id') {
                            $tableFieldArr['secondary_group_id'] = trim($value);
                        } else if ($key == 'sec_address_1') {
                            $tableFieldArr['secondary_insurance_address_line_1'] = trim($value);
                        } else if ($key == 'sec_address_2') {
                            $tableFieldArr['secondary_insurance_address_line_2'] = trim($value);
                        } else if ($key == 'sec_city') {
                            $tableFieldArr['secondary_insurance_city'] = trim($value);
                        } else if ($key == 'sec_state') {
                            $tableFieldArr['secondary_insurance_state'] = trim($value);
                        } else if ($key == 'sec_zipcode') {
                            $tableFieldArr['secondary_insurance_zipcode'] = trim($value);
                        } else if ($key == 'ter_ins_name') {
                            $tableFieldArr['tertiary_insurance_name'] = trim($value);
                        } else if ($key == 'ter_pol_id') {
                            $tableFieldArr['tertiary_policy_id'] = trim($value);
                        } else if ($key == 'ter_group_id') {
                            $tableFieldArr['tertiary_group_id'] = trim($value);
                        } else if ($key == 'ter_address_1') {
                            $tableFieldArr['tertiary_insurance_address_line_1'] = trim($value);
                        } else if ($key == 'ter_address_2') {
                            $tableFieldArr['tertiary_insurance_address_line_2'] = trim($value);
                        } else if ($key == 'ter_city') {
                            $tableFieldArr['tertiary_insurance_city'] = trim($value);
                        } else if ($key == 'ter_state') {
                            $tableFieldArr['tertiary_insurance_state'] = trim($value);
                        } else if ($key == 'ter_zipcode') {
                            $tableFieldArr['tertiary_insurance_zipcode'] = trim($value);
                        } else if ($key == 'auth_no') {
                            $tableFieldArr['authorization'] = trim($value);
                        } else if ($key == 'rendering_prov') {
                            $tableFieldArr['rendering_provider'] = trim($value);
                        } else if ($key == 'billing_prov') {
                            $tableFieldArr['billing_provider'] = trim($value);
                        } else if ($key == 'claim_note') {
                            $tableFieldArr['claim_note'] = trim($value);
                        } else if ($key == 'denial_code') {
                            $tableFieldArr['denial_code'] = trim($value);
                        } else
                            $tableFieldArr[$key] = trim($value);
                    }


                    //dd($op_array);

                    foreach ($op_array as $key => $value) {
                        Log::info($key . '------' . $value);
                        if ($key == 'acct_no') {
                            if (!empty($op_array['acct_no'])) {
                                $op_array['acct_no'] = trim($value);
                            }
                        }

                        if ($key == 'claim_no') {
                            if (!empty($op_array['claim_no'])) {
                                $op_array['claim_no'] = trim($value);
                            }
                        }

                        if ($key == 'patient_name') {
                            if (!empty($op_array['patient_name'])) {
                                $op_array['patient_name'] = trim($value);
                            }
                        }

                        if ($key == 'gender') {
                            if (!empty($op_array['gender'])) {
                                $op_array['gender'] = trim($value);
                            }
                        }

                        if ($key == 'address_line_1') {
                            if (!empty($op_array['address_line_1'])) {
                                $op_array['address_line_1'] = trim($value);
                            }
                        }

                        if ($key == 'address_line_2') {
                            if (!empty($op_array['address_line_2'])) {
                                $op_array['address_line_2'] = trim($value);
                            }
                        }

                        if ($key == 'city') {
                            if (!empty($op_array['city'])) {
                                $op_array['city'] = trim($value);
                            }
                        }

                        if ($key == 'state') {
                            if (!empty($op_array['state'])) {
                                $op_array['state'] = trim($value);
                            }
                        }

                        if ($key == 'zipcode') {
                            if (!empty($op_array['zipcode'])) {
                                $op_array['zipcode'] = trim($value);
                            }
                        }

                        if ($key == 'guarantor') {
                            if (!empty($op_array['guarantor'])) {
                                $op_array['guarantor'] = trim($value);
                            }
                        }

                        if ($key == 'employer') {
                            if (!empty($op_array['employer'])) {
                                $op_array['employer'] = trim($value);
                            }
                        }

                        if ($key == 'responsibility') {
                            if (!empty($op_array['responsibility'])) {
                                $op_array['responsibility'] = trim($value);
                            }
                        }

                        if ($key == 'insurance_type') {
                            if (!empty($op_array['insurance_type'])) {
                                $op_array['insurance_type'] = trim($value);
                            }
                        }

                        if ($key == 'primary_insurance_name') {
                            if (!empty($op_array['primary_insurance_name'])) {
                                $op_array['primary_insurance_name'] = trim($value);
                            }
                        }

                        if ($key == 'primary_policy_id') {
                            if (!empty($op_array['primary_policy_id'])) {
                                $op_array['primary_policy_id'] = trim($value);
                            }
                        }

                        if ($key == 'primary_group_id') {
                            if (!empty($op_array['primary_group_id'])) {
                                $op_array['primary_group_id'] = trim($value);
                            }
                        }

                        if ($key == 'primary_insurance_address_line_1') {
                            if (!empty($op_array['primary_insurance_address_line_1'])) {
                                $op_array['primary_insurance_address_line_1'] = trim($value);
                            }
                        }

                        if ($key == 'primary_insurance_address_line_2') {
                            if (!empty($op_array['primary_insurance_address_line_2'])) {
                                $op_array['primary_insurance_address_line_2'] = trim($value);
                            }
                        }

                        if ($key == 'primary_insurance_city') {
                            if (!empty($op_array['primary_insurance_city'])) {
                                $op_array['primary_insurance_city'] = trim($value);
                            }
                        }

                        if ($key == 'primary_insurance_state') {
                            if (!empty($op_array['primary_insurance_state'])) {
                                $op_array['primary_insurance_state'] = trim($value);
                            }
                        }

                        if ($key == 'primary_insurance_zipcode') {
                            if (!empty($op_array['primary_insurance_zipcode'])) {
                                $op_array['primary_insurance_zipcode'] = trim($value);
                            }
                        }

                        if ($key == 'secondary_insurance_name') {
                            if (!empty($op_array['secondary_insurance_name'])) {
                                $op_array['secondary_insurance_name'] = trim($value);
                            }
                        }

                        if ($key == 'secondary_policy_id') {
                            if (!empty($op_array['secondary_policy_id'])) {
                                $op_array['secondary_policy_id'] = trim($value);
                            }
                        }

                        if ($key == 'secondary_group_id') {
                            if (!empty($op_array['secondary_group_id'])) {
                                $op_array['secondary_group_id'] = trim($value);
                            }
                        }

                        if ($key == 'secondary_insurance_address_line_1') {
                            if (!empty($op_array['secondary_insurance_address_line_1'])) {
                                $op_array['secondary_insurance_address_line_1'] = trim($value);
                            }
                        }

                        if ($key == 'secondary_insurance_address_line_2') {
                            if (!empty($op_array['secondary_insurance_address_line_2'])) {
                                $op_array['secondary_insurance_address_line_2'] = trim($value);
                            }
                        }

                        if ($key == 'secondary_insurance_city') {
                            if (!empty($op_array['secondary_insurance_city'])) {
                                $op_array['secondary_insurance_city'] = trim($value);
                            }
                        }

                        if ($key == 'secondary_insurance_state') {
                            if (!empty($op_array['secondary_insurance_state'])) {
                                $op_array['secondary_insurance_state'] = trim($value);
                            }
                        }

                        if ($key == 'secondary_insurance_zipcode') {
                            if (!empty($op_array['secondary_insurance_zipcode'])) {
                                $op_array['secondary_insurance_zipcode'] = trim($value);
                            }
                        }

                        if ($key == 'tertiary_insurance_name') {
                            if (!empty($op_array['tertiary_insurance_name'])) {
                                $op_array['tertiary_insurance_name'] = trim($value);
                            }
                        }

                        if ($key == 'tertiary_policy_id') {
                            if (!empty($op_array['tertiary_policy_id'])) {
                                $op_array['tertiary_policy_id'] = trim($value);
                            }
                        }

                        if ($key == 'tertiary_group_id') {
                            if (!empty($op_array['tertiary_group_id'])) {
                                $op_array['tertiary_group_id'] = trim($value);
                            }
                        }

                        if ($key == 'tertiary_insurance_address_line_1') {
                            if (!empty($op_array['tertiary_insurance_address_line_1'])) {
                                $op_array['tertiary_insurance_address_line_1'] = trim($value);
                            }
                        }

                        if ($key == 'tertiary_insurance_address_line_2') {
                            if (!empty($op_array['tertiary_insurance_address_line_2'])) {
                                $op_array['tertiary_insurance_address_line_2'] = trim($value);
                            }
                        }

                        if ($key == 'tertiary_insurance_city') {
                            if (!empty($op_array['tertiary_insurance_city'])) {
                                $op_array['tertiary_insurance_city'] = trim($value);
                            }
                        }

                        if ($key == 'tertiary_insurance_state') {
                            if (!empty($op_array['tertiary_insurance_state'])) {
                                $op_array['tertiary_insurance_state'] = trim($value);
                            }
                        }

                        if ($key == 'tertiary_insurance_zipcode') {
                            if (!empty($op_array['tertiary_insurance_zipcode'])) {
                                $op_array['tertiary_insurance_zipcode'] = trim($value);
                            }
                        }

                        if ($key == 'authorization') {
                            if (!empty($op_array['authorization'])) {
                                $op_array['authorization'] = trim($value);
                            }
                        }

                        if ($key == 'rendering_provider') {
                            if (!empty($op_array['rendering_provider'])) {
                                $op_array['rendering_provider'] = trim($value);
                            }
                        }

                        if ($key == 'billing_provider') {
                            if (!empty($op_array['billing_provider'])) {
                                $op_array['billing_provider'] = trim($value);
                            }
                        }

                        if ($key == 'facility') {
                            if (!empty($op_array['facility'])) {
                                $op_array['facility'] = trim($value);
                            }
                        }

                        if ($key == 'modifiers') {
                            if (!empty($op_array['modifiers'])) {
                                $op_array['modifiers'] = trim($value);
                            }
                        }

                        if ($key == 'units') {
                            if (!empty($op_array['units'])) {
                                $op_array['units'] = trim($value);
                            }
                        }

                        if ($key == 'icd') {
                            if (!empty($op_array['icd'])) {
                                $op_array['icd'] = trim($value);
                            }
                        }

                        if ($key == 'claim_Status') {
                            if (!empty($op_array['claim_Status'])) {
                                $op_array['claim_Status'] = trim($value);
                            }
                        }

                        if ($key == 'claim_note') {
                            if (!empty($op_array['claim_note'])) {
                                $op_array['claim_note'] = trim($value);
                            }
                        }

                        if ($key == 'dos') {
                            if ($op_array['dos'] == 0) {
                                $op_array['dos'] = '';
                            } else {
                                $values = trim($value);
                                $op_array['dos'] = date('Y-m-d', strtotime($values));
                            }
                        }
                        if ($key == 'dob') {
                            if ($op_array['dob'] == 0) {
                                $op_array['dob'] = '';
                            } else {
                                $values = trim($value);
                                $op_array['dob'] = date('Y-m-d', strtotime($values));
                            }
                        }
                        if ($key == 'admit_date') {
                            if ($op_array['admit_date'] == 0) {
                                $op_array['admit_date'] = '';
                            } else {
                                $values = trim($value);
                                $op_array['admit_date'] = date('Y-m-d', strtotime($values));
                            }
                        }

                        if ($key == 'discharge_date') {
                            if ($op_array['discharge_date'] == 0) {
                                $op_array['discharge_date'] = '';
                            } else {
                                $values = trim($value);
                                $op_array['discharge_date'] = date('Y-m-d', strtotime($values));
                            }
                        }

                        if ($key == 'pat_ar') {
                            if (!empty($value)) {
                                $values = trim(number_format((float)$value, 2, '.', ''));
                                $op_array['pat_ar'] = $values;
                            }
                        }

                        if ($key == 'total_charges') {
                            if (!empty($value)) {
                                $values = trim($value);
                                $op_array['total_charges'] = number_format((float)$values, 2, '.', '');
                            }
                        }

                        if ($key == 'ins_ar') {
                            if (!empty($value)) {
                                $values = trim($value);
                                $op_array['ins_ar'] = number_format((float)$values, 2, '.', '');
                            }
                        }

                        if ($key == 'total_ar') {
                            if (!empty($value)) {
                                $values = trim($value);
                                $op_array['total_ar'] = number_format((float)$values, 2, '.', '');
                            }
                        }
                        if ($key == 'billedlast_submit_date') {
                            if ($op_array['billedlast_submit_date'] == 0) {
                                $op_array['billedlast_submit_date'] = '';
                            } else {
                                $values = trim($value);
                                $op_array['billedlast_submit_date'] = date('Y-m-d', strtotime($values));
                            }
                        }

                        if ($key == 'denial_code') {
                            if (!empty($op_array['denial_code'])) {
                                $op_array['denial_code'] = trim($value);
                            }
                        }
                    }
                    $difference = array_diff($op_array, $mismatch);
                    //dd($difference);
                    $key_diff = array_keys($difference);
                    //dd($key_diff);
                    //   $display_data['test_data']=$op_array;
                    //   $display_data['test_data1']=$difference;
                    //   $display_data['test_data2']=$key_diff;

                    //Mismatched Claims must be Differentiated Here
                    $mismatch = 0;

                    /*Exceptions       */
                    $exception = ['total_ar_due', 'ins_ar', 'units', 'modifier', 'icd', 'cpt', 'dos', 'billedlast_submit_date'];
                    foreach ($key_diff as $diff) {
                        if (in_array($diff, $jsonindex)) {

                            // array_push($jsonindex,$value);
                            // array_push($field_keys,$json);

                            $key = array_search($diff, $field_keys);
                            $diff_pass = $jsonindex[$key];


                            if ($jsondec[$diff_pass][1] == 'notify') {

                                /* Due to Line Items */
                                if (!in_array($diff, $exception)) {
                                    $mismatch++;


                                    $mismatch_data[$op_array['claim_no']]['midb'][$diff] = $tableFieldArr[$diff];
                                    $mismatch_data[$op_array['claim_no']]['mupd'][$diff] = $op_array[$diff];
                                    //dd($mismatch_data[$op_array['claim_no']]['mupd'][$diff]);
                                }
                            }
                        }
                    }
                    if ($mismatch > 0 && !in_array($op_array['claim_no'], $mismat_monitor)) {
                        // dd($mismat_monitor);
                        // dd($op_array['claim_no']);
                        $mismatch_record++;
                        // dd($mismatch_record++);
                        array_push($mismat_monitor, $op_array['claim_no']);

                        //dd($mismat_monitor);
                    }

                    $display_data['mismatch_data'] = $mismatch_data;
                    // print_r($display_data['mismatch_data']);
                    $display_data['duplicate_data'] = $duplicate_data;
                    $display_data['duplicate_filter'] = $duplicate_filter;



                    /*Update Line Items Part - 1*/

                    $upd_monitor = [];
                    array_push($upd_line_items, $op_array);

                    if (!in_array($op_array['claim_no'], $upd_monitor)) {
                        //dd($op_array['claim_no']);
                        array_push($upd_monitor, $op_array['claim_no']);
                        DB::table('line_items')->where('claim_id', $op_array['claim_no'])->delete();
                    }
                    //Update Line Items EOP - 1
                } else {

                    if (!in_array($op_array['claim_no'], $new_filter)) {
                        $total_records++;
                        $new_record++;
                        array_push($new_filter, $op_array['claim_no']);
                        array_push($new_filter_data, $op_array);
                    }


                    array_push($new_data, $op_array['claim_no']);
                    array_push($newdata, $op_array);
                    // $newdata[$op_array['claim_no']]=$op_array;
                    $display_data['mismatch_data'] = [];
                    $display_data['duplicate_data'] = [];
                    $display_data['duplicate_filter'] = [];
                }
                $display_data['new_data'] =  $new_data;
                $display_data['new_datas'] =  $newdata;
                $display_data['new_filter'] = $new_filter;
                $display_data['new_filter_data'] = $new_filter_data;
                $display_data['mismatch_nos'] = $mismatch_record;
                //dd($display_data['mismatch_nos']);


                //   $display_data['test_data3']=$difference;

                //Import+field data Insert Code
                /*$import=Import_field::create(
                                      $op_array
                                );*/
            }
        }


        /*Line items Update Code contd...*/

        if (sizeof($upd_line_items) != 0) {
            foreach ($upd_line_items as $update) {
                $import_line = Line_item::create(
                    array(
                        'claim_id'          => $update['claim_no'],
                        'total_ar_due'      => $update['total_ar'],
                        'ins_ar'            => $update['ins_ar'],
                        'pat_ar'            => $update['pat_ar'],
                        'units'             => $update['units'],
                        'modifier'          => $update['modifiers'],
                        'icd'               => $update['icd'],
                        'cpt'               => $update['cpt'],
                        'dos'               => $update['dos']
                    )
                );
            }
        }

        /*Get Fields Name*/

        // $field_name= Config::get('names');
        // $display_data['field_name'] = $field_name;

        // $destination=public_path('../config/names.txt');
        // $field_name = json_decode(file_get_contents($destination) , true);


        $field_name = [
            "acct_no" => "Account Number",
            "claim_no" => "Claim Number",
            "patient_name" => "Patient Name",
            "dos" => "DOS",
            "dob" => "DOB",
            "ssn" => "SSN",
            "gender" => "Gender",
            "phone_no" => "Phone Number",
            "address_line_1" => "Address 1",
            "address_line_2" => "Address 2",
            "city" => "City",
            "state" => "State",
            "zipcode" => "Zip Code",
            "guarantor" => "Guarantor",
            "employer" => "Employer",
            "responsibility" => "Responsibility",
            "insurance_type" => "Insurance Type",
            "primary_insurance_name" => "Primary Insurance Name",
            "primary_policy_id" => "Primary Policy ID",
            "primary_group_id" => "Primary Group ID",
            "primary_insurance_address_line_1" => "Primary Address 1",
            "primary_insurance_address_line_2" => "Primary Address 2",
            "primary_insurance_city" => "Primary City",
            "primary_insurance_state" => "Primary State",
            "primary_insurance_zipcode" => "Primary Zip Code",
            "secondary_insurance_name" => "Secondary Insurance Name",
            "secondary_policy_id" => "Secondary Policy ID",
            "secondary_group_id" => "Secondary Group ID",
            "secondary_insurance_address_line_1" => "Secondary Address 1",
            "secondary_insurance_address_line_2" => "Secondary Address 2",
            "secondary_insurance_city" => "Secondary City",
            "secondary_insurance_state" => "Secondary State",
            "secondary_insurance_zipcode" => "Secondary Zip Code",
            "tertiary_insurance_name" => "Tertiary Insurance Name",
            "tertiary_policy_id" => "Tertiary Policy ID",
            "tertiary_group_id" => "Tertiary Group ID",
            "tertiary_insurance_address_line_1" => "Tertiary Address 1",
            "tertiary_insurance_address_line_2" => "Tertiary Address 2",
            "tertiary_insurance_city" => "Tertiary City",
            "tertiary_insurance_state" => "Tertiary State",
            "tertiary_insurance_zipcode" => "Tertiary Zip Code",
            "authorization" => "Authentication Number",
            "rendering_provider" => "Rendering Provider",
            "billing_provider" => "Billing Provider",
            "facility" => "Facility",
            "admit_date" => "Admit Date",
            "discharge_date" => "Discharge Date",
            "cpt" => "CPT",
            "icd" => "ICD",
            "modifiers" => "Modifiers",
            "units" => "Units",
            "total_charges" => "Total Charges",
            "pat_ar" => "Patient AR",
            "ins_ar" => "Insurance AR",
            "total_ar" => "Total AR",
            "claim_Status" => "Claim Status",
            "claim_note" => "Claim Note",
            "billedlast_submit_date" => "Billed/Last Submit Date",
            "denial_code" => "Denial Code"

        ];

        $display_data['field_name'] = $field_name;

        // $display_data['Test']=$upd_line_items;




        //Insert code for 'file_uploads' Table

        $upload_check = File_upload::where('file_name', $filename)->first();


        //Check Values
        if ($report_date != NULL) {
            $date = $report_date;
            $date = date('Y-m-d h:i:s', strtotime($date));

            $file_upload = File_upload::create(
                [
                    'report_date'         => $date, //
                    'file_name'           => $filename,
                    'unique_name'         => $unique_name,
                    'file_url'            => $path,
                    'notes'               => $notes,
                    'total_claims'        => $total_records,
                    'new_claims'          => $new_record,
                    'Import_by'           => $user,
                    'claims_processed'    => '0',
                    'status'              => 'Incomplete',
                    'deleted_at'          => '2018-09-25 09:30:57'
                ]
            );
            $display_data['filedata'] = $file_upload;
        } else {
            $display_data['filedata'] = $upload_check;
        }

        $uploaded_by = User::where('id', $display_data['filedata']['Import_by'])->pluck('firstname');

        $display_data['filedata']['uploaded'] = $uploaded_by[0];
        return $display_data;
    }


    /** Developer : Sathish
     *  Date : 14/12/2022
     *  Purpose : File Name and Count to get dropdown Fields
     */

    public function get_file_ready_count(LoginRequest $request)
    {
        $get_file_count = [
            'code' => 204,
            'message' => 'No Data Found'
        ];
        try {
            if ($request) {
                $response_data = Import_field::select('import_fields.file_upload_id', 'file_uploads.file_name', DB::raw("COUNT(import_fields.file_upload_id) as file_count"))
                    ->join('file_uploads', 'file_uploads.id', '=', 'import_fields.file_upload_id')
                    ->where('import_fields.claim_Status', Null)->groupBy('import_fields.file_upload_id')->get();

                $get_file_count = [
                    'code' => 200,
                    'message' => 'success',
                    'file_datas' => $response_data
                ];
                return Response::json($get_file_count);
            }
        } catch (Exception $e) {
            Log::debug($e->getMessage());
        }
    }

    /** Developer : Sathish
     *  Date : 12/12/2022
     *  Purpose : To Update Auto Close in Assigned Claims
     */

    public function updateAutoClose(LoginRequest $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'file_name' => 'required|mimes:xlsx, csv, xls',
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => $validator->errors()], 401);
            }

            $practice_dbid = $request->get('practice_dbid');
            $savedata = $request->file('file_name');
            $filename = $request->file('file_name')->getClientOriginalName();
            $user = $request->get('user_id');
            $unique_name = md5($filename . time());
            $filename = date('Y-m-d') . '_' . $filename;
            $path = "../uploads/auto_close";
            $savedata->move($path, $unique_name);
            $path = "../uploads/auto_close/" . $unique_name;
            $report_date = $request->get('report_date');
            $notes = $request->get('notes');

            $op_data = $this->file_autoclose($filename, $user, $unique_name, $practice_dbid);
            return response()->json([
                'data' =>  $op_data,
                'message'  => "Auto Claims Close Complete"
            ]);

            // if($validator->fails()) {
            //     return response()->json(['error'=>$validator->errors()], 401);
            // }


            // if ($file = $request->file('file')) {
            //     $path = $file->store('public/files');
            //     $name = $file->getClientOriginalName();

            //     //store your file into directory and db
            //     $save = new File();
            //     $save->name = $file;
            //     $save->store_path= $path;
            //     $save->save();

            //     return response()->json([
            //         "success" => true,
            //         "message" => "File successfully uploaded",
            //         "file" => $file
            //     ]);

            // }

        } catch (Exception $e) {
            log::debug('Auto Close Import Error :' . $e->getmessage());
        }
    }

    protected function file_autoclose($filename, $user, $unique_name, $practice_dbid)
    {
        $display_data = [];
        $mismatch_data = [];
        $duplicate_data = [];
        $new_data = [];
        $duplicate_details = [];
        $newdata = [];

        $duplicate_filter = [];
        $new_filter = [];
        $new_filter_data = [];


        $duplicate_record = 0;
        $new_record = 0;
        $mismatch_record = 0;
        $total_records = 0;
        $mismat_monitor = [];

        $upd_line_items = [];


        $path = "uploads/auto_close/" . $unique_name;
        // $data = Excel::load($path, function ($reader) {
        // })->get();

        $data = [];

        $count = 1;
        $array = $data;

        $present_data = Config::get('fields_auto_close.data');
        $op_array = [];

        foreach ($present_data as $key => $value) {
            $op_array[$value] = NULL;
        }

        $destinationPath = public_path('../config/test/autoclose.txt');
        $jsondec = json_decode(file_get_contents($destinationPath), true);
        $jsonindex = array_keys($jsondec);
        /*Handle names*/
        $field_value = Config::get('fields_auto_close.data');

        $field_keys = [];

        foreach ($jsonindex as $json) {
            $value = $field_value[$json];
            array_push($jsonindex, $value);
            array_push($field_keys, $json);
        }
        $name_destinationPath = public_path('../config/test/auto_close_fields_name.txt');
        $name_jsondec = json_decode(file_get_contents($name_destinationPath), true);

        foreach ($name_jsondec as $key => $value) {
            $value = strtolower($value);
            $value_changed = str_replace(" ", "_", $value);
            $name_jsondec[$key] = $value_changed;
        }

        foreach ($array as $val) {
            $index_ip = array_keys($val);
            if ($val['claim_no'] != null) {
                /*To Change Name from Upload DOC to work name*/
                $name_changed = [];
                $i = 1;
                foreach ($name_jsondec as $key => $value) {
                    $index_ip = array_filter($index_ip);
                    if (in_array($value, $index_ip)) {
                        $name_changed[$key] = $val[$value];
                        $i++;
                    }
                }

                $val = $name_changed;
                $index_ip = array_keys($val);
                $count_ip = count($index_ip);
                $index_present = array_keys($present_data);

                for ($i = 0; $i < $count_ip; $i++) {
                    if (in_array($index_ip[$i], $index_present)) {
                        if ($val[$index_ip[$i]] == NULL) {
                            $op_array[$present_data[$index_ip[$i]]] = NULL;
                        } else if (is_object($val[$index_ip[$i]]) == true) {
                            $op_array[$present_data[$index_ip[$i]]] = $val[$index_ip[$i]]->format('m/d/Y');
                        } else {
                            $op_array[$present_data[$index_ip[$i]]] = $val[$index_ip[$i]];
                        }
                    }
                }

                // DO the Process Work HERE**********
                $check_claim_exists = Import_field::where('claim_no', $op_array['claim_no'])->where('acct_no', $op_array['acct_no'])->get();
                // echo "<pre>"; print_r($check_claim_exists); echo "</pre>"; exit;
                if ($check_claim_exists->count() != 0) {
                    if (!in_array($op_array['claim_no'], $duplicate_filter)) {
                        $duplicate_record++;
                        $total_records++;
                        array_push($duplicate_filter, $op_array['claim_no']);
                    }

                    array_push($duplicate_data, $op_array['claim_no']);
                    $mismatch = Import_field::where('claim_no', $op_array['claim_no'])->where('acct_no', $op_array['acct_no'])->get();
                    // echo "<pre>"; print_r($mismatch); echo "</pre>"; exit;
                    $mismat_data = $mismatch;

                    $import = AutoCloseClaimModel::create(
                        [
                            'claim_no' => $op_array['claim_no'],
                            'acct_no' => $op_array['acct_no'],
                            'import_by' => $user,
                            'file_name' => $filename,
                            'file_url' => $path,
                            'auto_close_date' => date('Y-m-d'),
                        ]
                    );
                    $update_claim_status = Import_field::where('claim_no', $op_array['claim_no'])->where('acct_no', $op_array['acct_no'])->update(
                        [
                            'claim_Status' => 'auto_close',
                        ]
                    );

                    // $tableFieldArr = [];
                    // foreach ($mismat_data as $key => $value) {
                    // }

                    // foreach ($op_array as $key => $value) {
                    //   if ($key == 'acct_no') {
                    //     if (!empty($op_array['acct_no'])) {
                    //       $op_array['acct_no'] = trim($value);
                    //     }
                    //   }

                    //   if ($key == 'claim_no') {
                    //     if (!empty($op_array['claim_no'])) {
                    //       $op_array['claim_no'] = trim($value);
                    //     }
                    //   }

                    // }
                    // $difference = array_diff($op_array, $mismatch);

                    // $key_diff = array_keys($difference);
                    // //Mismatched Claims must be Differentiated Here
                    // $mismatch = 0;
                    // if ($mismatch > 0 && !in_array($op_array['claim_no'], $mismat_monitor)) {
                    //   $mismatch_record++;
                    //   array_push($mismat_monitor, $op_array['claim_no']);
                    // }

                    // $display_data['mismatch_data'] = $mismatch_data;
                    // $display_data['duplicate_data'] = $duplicate_data;
                    // $display_data['duplicate_filter'] = $duplicate_filter;


                    // $upd_monitor = [];
                    // array_push($upd_line_items, $op_array);

                    // if (!in_array($op_array['claim_no'], $upd_monitor)) {
                    //   array_push($upd_monitor, $op_array['claim_no']);
                    // DB::table('line_items')->where('claim_id', $op_array['claim_no'])->delete();
                    // }
                } else {
                    log::debug("No Match Record");
                }

                $display_data['import_file'] = ['import_by' => $import->import_by, 'file_name' => $import->file_name, 'file_url' => $import->file_url, 'auto_close_date' => $import->auto_close_date];
            }
        }


        return $display_data;
    }


    public function get_payer_name(LoginRequest $request)
    {
        try {
            $prim_ins_name = Import_field::whereNull('followup_work_order')
                ->where('prim_ins_name', '<>', NULL)
                ->where('claim_Status', NULL)
                ->orWhere('claim_Status', 'Ready')
                ->pluck('prim_ins_name')->toArray();
            $sec_ins_name = Import_field::whereNull('followup_work_order')
                ->Where('sec_ins_name', '<>', NULL)
                ->where('claim_Status', NULL)
                ->orWhere('claim_Status', 'Ready')
                ->pluck('sec_ins_name')->toArray();
            $ter_ins_name = Import_field::whereNull('followup_work_order')
                ->Where('ter_ins_name', '<>', NULL)
                ->where('claim_Status', NULL)
                ->orWhere('claim_Status', 'Ready')
                ->pluck('ter_ins_name')->toArray();
            $payer_name = array_values(array_unique(array_merge($prim_ins_name, $sec_ins_name, $ter_ins_name)));
            if ($payer_name && $payer_name != null) {
                $payer_details = array('status' => 200, 'payer_names' => $payer_name);
                return Response::json($payer_details);
            } else {
                $payer_details = array('status' => 400, 'payer_names' => []);
                return Response::json($payer_details);
            }
        } catch (Exception $e) {
            log::debug($e->getMessage());
        }
    }

    public function reImport(LoginRequest $request)
    {
        try {
            $practice_dbid = $request->get('practice_dbid');
            $savedata = $request->file('file_name');
            $filename = $request->file('file_name')->getClientOriginalName();
            $user = $request->get('user_id');
            $unique_name = md5($filename . time());
            $filename = date('Y-m-d') . '_' . $filename;
            $path = "../uploads/reimport";
            $savedata->move($path, $unique_name);
            $path = "../uploads/reimport/" . $unique_name;
            $report_date = $request->get('report_date');
            $notes = $request->get('notes');

            $op_data = $this->file_reimport_process($filename, $report_date, $notes, $user, $unique_name, $practice_dbid);
            return response()->json([
                'message' =>  $op_data,
                'reimport_msg'  => "Reimport Complete"
            ]);
        } catch (Exception $e) {
            Log::debug('Reimport Error' . $e->getMessage());
        }
    }


    protected function file_reimport_process($filename, $report_date, $notes, $user, $unique_name, $practice_dbid)
    {
        $path = "uploads/reimport/" . $unique_name;
        // $data = Excel::load($path, function ($reader) {
        // })->get();

        $data = [];

        $total_count = 1;
        $reimport_datas = $data;

        $already_worked_count = 0;
        $valid_count = 0;
        $display_data = [];
        $assigned_data = Import_field::where('claim_Status', 'Assigned')->where('followup_date', NULL)->orderBy('id', 'desc')->pluck('claim_no')->toArray();
        // print_r($assigned_data);  exit;
        foreach ($reimport_datas as $reimport_data) {
            if (in_array($reimport_data['claim_no'], $assigned_data)) {
                $valid_count++;

                $Claim_history = Claim_history::create([
                    'claim_id'          => $reimport_data['claim_no'],
                    'claim_state'       => 10,
                    'assigned_to'       => NULL,
                    'assigned_by'       => $user,
                    'created_at'        => date('Y-m-d H:i:s')
                ]);

                Action::where('claim_id', $reimport_data['claim_no'])->delete();

                $update = array('claim_Status' => NULL, 'followup_associate' => NULL, 'followup_work_order' => NULL, 'assigned_to' => NULL, 'reimport_status' => 'Reimport');
                $s = Import_field::where('claim_no', $reimport_data['claim_no'])->where('claim_Status', 'Assigned')->where('followup_date', NULL)->update($update);

                $assignedWOs = Workorder_user_field::select('cliam_no')->where('cliam_no', '<>', '[]')->orderBy('id', 'DESC')->get();

                foreach ($assignedWOs as $assignedWO) {
                    $decodes =  json_decode($assignedWO['cliam_no'], true);
                    if (in_array($reimport_data['claim_no'], $decodes)) {
                        $pos = array_search($reimport_data['claim_no'], $decodes, true);
                        $splice = array_splice($decodes, $pos, 1);
                        $encoded = json_encode($decodes);

                        $max_length = 4294967295; // maximum length of a longtext column
                        if (strlen($encoded) > $max_length) {
                            $chunks = str_split($encoded, $max_length);
                            foreach ($chunks as $chunk) {
                                $encode_update = Workorder_user_field::where('cliam_no', $assignedWO['cliam_no'])
                                    ->update(['cliam_no' => $chunk]);
                            }
                        } else {
                            $encode_update = Workorder_user_field::where('cliam_no', $assignedWO['cliam_no'])
                                ->update(['cliam_no' => $encoded]);
                        }

                        // $encode_update = Workorder_user_field::whereJsonContains('cliam_no', $assignedWO['cliam_no'])
                        //   ->update(['cliam_no' => $encoded]);

                    }
                }
            } else {
                $already_worked_count++;
            }
        }

        $upload_check = Reimport::where('file_name', $filename)->first();
        if ($report_date != NULL) {
            $file_reupload = Reimport::create(
                [
                    'report_date'         => date('Y-m-d h:i:s', strtotime($report_date)),
                    'file_name'           => $filename,
                    'unique_name'         => $unique_name,
                    'file_url'            => $path,
                    'notes'               => $notes,
                    'total_claims'        => $valid_count,
                    'reimport_by'         => $user,
                    'claims_processed'    => '0',
                    'status'              => 'Incomplete'
                ]
            );
            $display_data['filedata'] = $file_reupload;
        } else {
            $display_data['filedata'] = $upload_check;
        }
        // $uploaded_by = User::where('id', $display_data['filedata']['reimport_by'])->pluck('firstname');

        // $display_data['filedata']['uploaded'] = $uploaded_by[0];
        $display_data['filedata']['already_assigned_count'] = $already_worked_count;

        return $display_data;
    }

    public function get_reimport_table_page(LoginRequest $request)
    {
        $page_no = $request->get('page_no');
        $page_count = $request->get('count');
        $total_count = 0;
        $skip = ($page_no - 1) * $page_count;
        $end = $page_count;

        $filedata = Reimport::orderBy('id', 'desc')->offset($skip)->limit($end)->get();
        $current_total = $filedata->count();

        $latest = Reimport::orderBy('id', 'desc')->take(1)->first();

        $imported_claims = array();

        foreach ($filedata as $index => $fd) {
            $date = explode(" ", $fd['report_date']);
            $import = $fd['reimport_by'];
            $user = User::where('id', $import)->pluck('firstname');

            if (sizeof($user) == 0) {
                $user = "NA";
            } else {
                $user = $user[0];
            }

            $file_name_date = explode("_", $fd['file_name']);

            $file_array = date("m/d/Y", strtotime($file_name_date[0]));

            $file_array1 = $file_name_date[1];

            foreach ($file_name_date as $key => $value) {
                $file_name_date[0] = $file_array;
                $file_name_date[1] = $file_array1;
            }

            $fd_file_name = implode('_', $file_name_date);

            $imported_claims[$index]['date'] = date("m/d/Y", strtotime($date[0]));
            $imported_claims[$index]['id'] = $fd['id'];
            $imported_claims[$index]['file_name'] = $fd_file_name;
            $imported_claims[$index]['claims'] =  $fd['total_claims'];
            $imported_claims[$index]['processed'] = $fd['claims_processed'];
            $imported_claims[$index]['uploaded'] = $user;
            $imported_claims[$index]['path'] = $fd['id'];
            $imported_claims[$index]['notes'] = $fd['notes'];
        }

        $count = Reimport::all()->count();

        //    dd($this->claims);
        return response()->json([
            'message' => $imported_claims,
            'latest_id' => $latest ? $latest['id'] : NULL,
            'count' => $count,
            'current_total' => $current_total,
            'skip' => $skip,
            'error' => "Upload Complete"
        ]);
    }

    public function reimport_template(LoginRequest $request)
    {
        $filePath = public_path('../config/reimport_template.xlsx');
        $headers = ['Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        $fileName = 'reimport_template.xlsx';

        return Response::download($filePath, $fileName, $headers);
    }


    public function move_create_work_order(LoginRequest $request)
    {
        try {
            $user_id = $request->get('user_id');
            $new_user_id = $request->get('new_user_id');
            $audit_claim_user_id = $request->get('audit_status_claims');

            if (isset($user_id) && $user_id != "null") {
                $claim_datas = Import_field::leftjoin(DB::raw("(SELECT claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE claim_notes.deleted_at IS NULL
                    AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT claim_histories.claim_id,claim_histories.created_at as created_ats
                    FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                    ) as claim_histories"), function ($join) {
                    $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                })->where('claim_status', 'Assigned')->where('assigned_to', $user_id)->where('followup_date', Null)->get();
                // Log::info('first claim datas'. print_r($claim_datas, true));
                if (count($claim_datas) > 0) {
                    foreach ($claim_datas as $claim_data) {
                        $Claim_history = Claim_history::create([
                            'claim_id'          => $claim_data['claim_no'],
                            'claim_state'       => 10,
                            'assigned_to'       => NULL,
                            'assigned_by'       => $user_id,
                            'created_at'        => date('Y-m-d H:i:s')
                        ]);

                        Action::where('claim_id', $claim_data['claim_no'])->delete();

                        $update = array('claim_Status' => NULL, 'followup_associate' => NULL, 'followup_work_order' => NULL, 'assigned_to' => NULL, 'reimport_status' => 'Reimport');
                        $status_update = Import_field::where('claim_no', $claim_data['claim_no'])->where('claim_Status', 'Assigned')->where('followup_date', NULL)->update($update);

                        $assignedWOs = Workorder_user_field::select('cliam_no')->where('cliam_no', '<>', '[]')->orderBy('id', 'DESC')->get();

                        foreach ($assignedWOs as $assignedWO) {
                            $decodes =  json_decode($assignedWO['cliam_no'], true);
                            if (in_array($claim_data['claim_no'], $decodes)) {
                                $pos = array_search($claim_data['claim_no'], $decodes, true);
                                $splice = array_splice($decodes, $pos, 1);
                                $encoded = json_encode($decodes);

                                $max_length = 4294967295; // maximum length of a longtext column
                                if (strlen($encoded) > $max_length) {
                                    $chunks = str_split($encoded, $max_length);
                                    foreach ($chunks as $chunk) {
                                        $encode_update = Workorder_user_field::where('cliam_no', $assignedWO['cliam_no'])
                                            ->update(['cliam_no' => $chunk]);
                                    }
                                } else {
                                    $encode_update = Workorder_user_field::where('cliam_no', $assignedWO['cliam_no'])
                                        ->update(['cliam_no' => $encoded]);
                                }
                            }
                        }
                    }
                }
            }

            if (isset($new_user_id) && $new_user_id != "null") {
                $reassigned_claims = Import_field::select('claim_no', 'followup_associate', 'claim_closing')->leftjoin(DB::raw("(SELECT claim_notes.claim_id FROM claim_notes WHERE claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT claim_histories.claim_id FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id)
                            GROUP BY claim_histories.claim_id) as claim_histories"), function ($join) {
                    $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                })->leftJoin('qc_notes', function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->whereIn('claim_status', ['Assigned', 'Client Assistance'])->where('followup_associate', $user_id)
                    ->whereIn('qc_notes.error_type', ['[2]', '[3]'])->whereNotNull('followup_date')->get();

                if (count($reassigned_claims) > 0) {
                    foreach ($reassigned_claims as $reassigned_claim) {
                        $import_fields = Import_field::where('claim_no', $reassigned_claim['claim_no'])->where('followup_associate', $user_id)->update(['followup_associate' => $new_user_id]);
                        $actions = Action::where('claim_id', $reassigned_claim['claim_no'])->where('assigned_to', $user_id)->update([
                            'assigned_to'       => $new_user_id
                        ]);
                        $Claim_history = Claim_history::where('claim_id', $reassigned_claim['claim_no'])->where('assigned_to', $user_id)->whereIn('claim_state', ['6', '7'])->update([
                            'assigned_to'       => $new_user_id,
                        ]);
                    }
                }
            }

            if (isset($audit_claim_user_id) && $audit_claim_user_id != "null") {
                $audit_datas = Import_field::select('claim_no')->leftjoin(DB::raw("(SELECT claim_notes.claim_id FROM claim_notes WHERE claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT claim_histories.claim_id,claim_histories.created_at as created_ats FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories
                      GROUP BY claim_histories.claim_id) AND `claim_histories`.`claim_state` IN ('4', '5', '6') GROUP BY claim_histories.claim_id) as claim_histories"), function ($join) {
                    $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin('qc_notes', 'import_fields.claim_no', '=', 'qc_notes.claim_id')
                    ->whereIn('claim_Status', ['Audit', 'Auditing'])
                    ->where('followup_associate', $user_id)
                    ->where('claim_closing', '<>', 1)->get();

                if (count($audit_datas) > 0) {
                    foreach ($audit_datas as $audit_data) {
                        $import_fields = Import_field::where('claim_no', $audit_data['claim_no'])->where('followup_associate', $user_id)->update(['followup_associate' => $audit_claim_user_id]);
                        $actions = Action::where('claim_id', $audit_data['claim_no'])->where('assigned_to', $user_id)->update([
                            'assigned_to'       => $audit_claim_user_id
                        ]);
                        $Claim_history = Claim_history::where('claim_id', $audit_data['claim_no'])->where('assigned_to', $user_id)->whereIn('claim_state', ['5', '6'])->update([
                            'assigned_to'       => $audit_claim_user_id,
                        ]);
                    }
                }
            }

            // if(count($claim_datas) > 0 && $new_user_id != 'null' && $audit_claim_user_id != 'null')
            // {
            //   return response()->json([
            //     'status' => 200,
            //     'reimport_msg'  => "Assigned claims has been moved to your work order, Reassigned and Audit Claims has been revoked from user"
            //   ]);
            // }else if(count($claim_datas) > 0 && $new_user_id == 'null' && $audit_claim_user_id == 'null')
            // {
            //   return response()->json([
            //     'status' => 200,
            //     'reimport_msg'  => "Assigned claims has been revoked from user"
            //   ]);
            // }else if(count($claim_datas) == 0 && $new_user_id != 'null' && $audit_claim_user_id != 'null')
            // {
            //   return response()->json([
            //     'status' => 200,
            //     'reimport_msg'  => "Reassigned and Audit Claims has been revoked from user"
            //   ]);
            // }else if(count($claim_datas) == 0 && $new_user_id != 'null' && $audit_claim_user_id == 'null')
            // {
            //   return response()->json([
            //     'status' => 200,
            //     'reimport_msg'  => "Reassigned Claims has been revoked from user"
            //   ]);
            // }else if(count($claim_datas) == 0 && $new_user_id == 'null' && $audit_claim_user_id != 'null')
            // {
            //   return response()->json([
            //     'status' => 200,
            //     'reimport_msg'  => "Audit Claims has been revoked from user"
            //   ]);
            // }else if(count($claim_datas) > 0 && $new_user_id != 'null' && $audit_claim_user_id == 'null'){
            //   return response()->json([
            //     'status' => 200,
            //     'reimport_msg'  => "Assigned and Reassigned Claims has been revoked from user"
            //   ]);
            // }else if(count($claim_datas) > 0 && $new_user_id == 'null' && $audit_claim_user_id != 'null'){
            //   return response()->json([
            //     'status' => 200,
            //     'reimport_msg'  => "Assigned and Audit Claims has been revoked from user"
            //   ]);
            // }else{
            //   return response()->json([
            //     'status' => 204,
            //     'reimport_msg'  => "User claims have not been revoked"
            //   ]);
            // }

            if (count($claim_datas) > 0 && ($new_user_id != 'null' || $audit_claim_user_id != 'null')) {
                return response()->json([
                    'status' => 200,
                    'reimport_msg' => "Claims Revoked Successfully"
                ]);
            } else if (count($claim_datas) == 0 && ($new_user_id != 'null' || $audit_claim_user_id != 'null')) {
                return response()->json([
                    'status' => 200,
                    'reimport_msg' => "Claims Revoked Successfully"
                ]);
            } else {
                return response()->json([
                    'status' => 204,
                    'reimport_msg' => "No claims has been revoked."
                ]);
            }
        } catch (Exception $e) {
            Log::debug('Revoke claims work order error:' . $e->getMessage());
        }
    }

    // public function reassign_another_user(LoginRequest $request)
    // {
    //   DB::beginTransaction();
    //   try{
    //     $exist_user_id = $request->get('exist_user_id');
    //     $new_user_id = $request->get('new_user_id');

    //     // DB::enableQueryLog();
    //     $reassigned_claims = Import_field::select('claim_no','followup_associate','claim_closing')->leftjoin(DB::raw("(SELECT claim_notes.claim_id FROM claim_notes WHERE claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
    //                     $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
    //                   })->leftjoin(DB::raw("(SELECT claim_histories.claim_id FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id)
    //                   GROUP BY claim_histories.claim_id) as claim_histories"), function ($join) {
    //                     $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
    //                   })->leftJoin('qc_notes', function ($join) {
    //                     $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
    //                   })->whereIn('claim_status', ['Assigned', 'Client Assistance'])->where('followup_associate', $exist_user_id)
    //                   ->whereIn('qc_notes.error_type', ['[2]', '[3]'])->whereNotNull('followup_date')->get();
    //     // dd(DB::getQueryLog());
    //     if($reassigned_claims)
    //     {
    //       foreach($reassigned_claims as $reassigned_claim){
    //         $import_fields = Import_field::where('claim_no', $reassigned_claim['claim_no'])->where('followup_associate', $exist_user_id)->update(['followup_associate' => $new_user_id]);
    //         $actions = Action::where('claim_id', $reassigned_claim['claim_no'])->where('assigned_to', $exist_user_id)->update([
    //           'assigned_to'       => $new_user_id ]);
    //         $Claim_history = Claim_history::where('claim_id', $reassigned_claim['claim_no'])->where('assigned_to', $exist_user_id)->whereIn('claim_state', ['6','7'])->update([
    //           'assigned_to'       => $new_user_id,
    //         ]);
    //         DB::commit();
    //       }

    //       return response()->json([
    //         'status'  => 200,
    //         'msg' => 'User Changed Successfully'
    //       ]);
    //     }else{
    //       return response()->json([
    //         'status'  => 204,   // No Content
    //         'msg'  => 'Something Went Wrong'
    //       ]);
    //     }
    //   }catch(Exception $e){
    //     DB::rollback();
    //     Log::debug('Reassign another User Error' . $e->getMessage());
    //   }
    // }


    public function get_reassigned_users(LoginRequest $request)
    {
        $user_id = $request->get('selected_u_id');

        $userList = Import_field::select('claim_no', 'followup_associate', 'claim_closing')->leftjoin(DB::raw("(SELECT claim_notes.claim_id FROM claim_notes WHERE claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
        })->leftjoin(DB::raw("(SELECT claim_histories.claim_id FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id)
                GROUP BY claim_histories.claim_id) as claim_histories"), function ($join) {
            $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
        })->leftJoin('qc_notes', function ($join) {
            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
        })->whereIn('claim_status', ['Assigned', 'Client Assistance'])->where('followup_associate', $user_id)
            ->whereIn('qc_notes.error_type', ['[2]', '[3]'])->whereNotNull('followup_date')->get();

        if (count($userList) == 0) {
            return response()->json([
                'status'  => 204,   // No Content
                'msg'  => 'No data available'
            ]);
        } else {
            return response()->json([
                'status'  => 200,
                'msg' => 'claims available, according to the user'
            ]);
        }
    }

    public function audit_claims_found_user(LoginRequest $request)
    {
        try {
            $user_id = $request->get('selected_u_id');
            $claim_data = Import_field::select('claim_no')->leftjoin(DB::raw("(SELECT claim_notes.claim_id FROM claim_notes WHERE claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
            })->leftjoin(DB::raw("(SELECT claim_histories.claim_id,claim_histories.created_at as created_ats FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories
                    GROUP BY claim_histories.claim_id) AND `claim_histories`.`claim_state` IN ('4', '5', '6') GROUP BY claim_histories.claim_id) as claim_histories"), function ($join) {
                $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
            })->leftjoin('qc_notes', 'import_fields.claim_no', '=', 'qc_notes.claim_id')
                ->whereIn('claim_Status', ['Audit', 'Auditing'])
                ->where('followup_associate', $user_id)
                ->where('claim_closing', '<>', 1)->get();
            if (count($claim_data) == 0) {
                return response()->json([
                    'status'  => 204,   // No Content
                    'msg'  => 'No data available'
                ]);
            } else {
                return response()->json([
                    'status'  => 200,
                    'msg' => 'Audit claims available, according to the user'
                ]);
            }
        } catch (Exception $e) {
            Log::Debug('audit_claims_found_user_error' . $e->getMessage());
        }
    }
}
