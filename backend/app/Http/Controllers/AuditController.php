<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\Action;
use App\Models\Claim_history;
use App\Models\Claim_note;
use App\Models\Error_type;
use App\Models\FYIParameter;
use App\Models\Import_field;
use App\Models\ParentParameter;
use App\Models\Root_cause;
use App\Models\Statuscode;
use App\Models\Sub_statuscode;
use App\Models\SubParameter;
use App\Models\User;
use App\Models\User_work_profile;
use App\Models\Workorder_field;
use App\Models\Workorder_user_field;
use Carbon\Carbon;
use DateTime;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;

class AuditController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['get_audit_claim_details', 'get_auditors', 'create_audit_workorder', 'fetch_export_data', 'get_audit_codes', 'auto_assign_claims', 'audit_assigned_order_list', 'auto_assigned', 'get_error_param_codes', 'get_fyi_param_codes', 'get_sub_error_param_codes']]);
    }

    //Get Audit Claim Details
    public function get_audit_claim_details(LoginRequest $request)
    {
        try {
            $user_id = $request->get('user_id');
            $claim_type = $request->get('type');

            $assignSearchValue = $request->get('assign_claim_searh');
            $closedSearchValue = $request->get('closed_claim_searh');


            $op_data = [];
            $present_data = Config::get('fields.data');
            $field_data = [];
            foreach ($present_data as $key => $value) {
                $field_data[$value] = $key;
            }
            $op_data['fields'] = $field_data;
            $user_role = User::where('id', $user_id)->first();

            $worked = [];
            $pending = [];
            $clams = [];
            $assign = [];
            $closed = [];

            $claims = Action::where('assigned_to', $user_id)->where('action_type', 2)->where('status', 'Active')->get();

            foreach ($claims as $active) {
                $date = date('Y-m-d', strtotime($active['created_at']));
                $allocated = Claim_history::where('claim_id', $active['claim_id'])->whereIN('claim_state', [4, 6, 7, 8, 9])->where('created_at', '>=', $date)->count();
                if ($allocated > 0) {
                    array_push($worked, $active['claim_id']);
                } else {
                    array_push($pending, $active['claim_id']);
                }
            }

            if ($claim_type == "wo") {
                $users = User::where('role_id', '4')->pluck('id');
                $claims = Action::whereIN('assigned_to', $users)->distinct('claim_id')->pluck('claim_id');

                $claim_data = Import_field::where(function ($query) use ($claims) {
                    $query->whereIN('claim_no', $claims)
                        ->orwhere('claim_Status', 'Audit')
                        ->orwhere('claim_Status', 'RCM Completed')
                        ->orwhere('claim_Status', 'CA Completed')
                        ->orwhere('claim_Status', 'CA Assigned')
                        ->orwhere('claim_Status', 'Closed');
                })->distinct('claim_no')->get();

                foreach ($claim_data as $key => $claim_datas) {
                    $getStatusCode = Statuscode::where('id', $claim_datas['status_code'])->first();
                    $claim_data[$key]['statuscode'] = $getStatusCode->status_code ? $getStatusCode->status_code : 'NA';

                    $getSubStatusCode = Sub_statuscode::where('id', $claim_datas['substatus_code'])->first();
                    $claim_data[$key]['substatuscode'] = $getSubStatusCode->status_code ? $getSubStatusCode->status_code : 'NA';
                }

                $claim_count = Import_field::where(function ($query) use ($claims) {
                    $query->whereIN('claim_no', $claims)
                        ->orwhere('claim_Status', 'Audit')
                        ->orwhere('claim_Status', 'RCM Completed')
                        ->orwhere('claim_Status', 'CA Completed')
                        ->orwhere('claim_Status', 'CA Assigned')
                        ->orwhere('claim_Status', 'Closed');
                })->distinct('claim_no')->count();
            } else if ($claim_type == "completed") {
                $claimInfo = Claim_history::orderBy('id', 'desc')->get()->unique('claim_id')->toArray();

                foreach ($claimInfo as $claimList) {
                    if (isset($claimList) && $claimList['claim_state'] == 9 &&  $claimList['assigned_by'] == $user_id)
                        array_push($closed, $claimList['claim_id']);
                }

                $claim_data = Import_field::leftjoin(DB::raw("(SELECT claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                      AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                    $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                })->whereIN('claim_no', $closed)->where('claim_closing', 1);

                if (isset($closedSearchValue['acc_no']) && !empty($closedSearchValue['acc_no'])) {
                    $claim_data->where('acct_no', $closedSearchValue['acc_no']);
                }

                if (isset($closedSearchValue['claim_no']) && !empty($closedSearchValue['claim_no'])) {
                    $claim_data->where('claim_no', $closedSearchValue['claim_no']);
                }

                if (isset($closedSearchValue['dos']) && $closedSearchValue['dos']['startDate'] != null) {
                    $dos_start_date = Carbon::createFromFormat('Y-m-d', $closedSearchValue['dos']['startDate'])->startOfDay();
                    $dos_end_date = Carbon::createFromFormat('Y-m-d', $closedSearchValue['dos']['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                }

                if (isset($closedSearchValue['patient_name']) && !empty($closedSearchValue['patient_name'])) {
                    $claim_data->where('patient_name', 'LIKE', '%' . $closedSearchValue['patient_name'] . '%');
                }

                if (isset($closedSearchValue['responsibility']) && !empty($closedSearchValue['responsibility'])) {
                    $claim_data->where('responsibility', 'LIKE', '%' . $closedSearchValue['responsibility'] . '%');
                }

                if (isset($closedSearchValue['total_ar']) && !empty($closedSearchValue['total_ar'])) {
                    $OriginalString = trim($closedSearchValue['total_ar']);
                    $tot_ar = explode("-", $OriginalString);
                    $min_tot_ar = $tot_ar[0] - 1.00;
                    $max_tot_ar = $tot_ar[1];

                    $claim_data->whereBetween('total_ar', [$min_tot_ar, $max_tot_ar]);
                }

                if (isset($closedSearchValue['rendering_provider']) && !empty($closedSearchValue['rendering_provider'])) {
                    $claim_data->where('rendering_prov', 'LIKE', '%' . $closedSearchValue['rendering_provider'] . '%');
                }

                if (isset($closedSearchValue['payer_name']) && !empty($closedSearchValue['payer_name'])) {
                    $claim_data->where('prim_ins_name', 'LIKE', '%' . $closedSearchValue['payer_name'] . '%');
                    $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $closedSearchValue['payer_name'] . '%');
                    $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $closedSearchValue['payer_name'] . '%');
                }

                if (isset($closedSearchValue['date']) && $closedSearchValue['date']['startDate'] != null) {
                    $search_date = $closedSearchValue['date'];
                    $created_start_date = Carbon::createFromFormat('Y-m-d', $search_date['startDate'])->startOfDay();
                    $created_end_date = Carbon::createFromFormat('Y-m-d', $search_date['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(import_fields.created_at)'), '>=', $created_start_date)->where(DB::raw('DATE(import_fields.created_at)'), '<=', $created_end_date);
                }

                if (isset($closedSearchValue['age_filter']) && $closedSearchValue['age_filter'] != null) {
                    $search_age = $closedSearchValue['age_filter'];
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

                if (isset($closedSearchValue['bill_submit_date']) && $closedSearchValue['bill_submit_date']['startDate'] != null) {
                    $search_submit_date = $closedSearchValue['bill_submit_date'];
                    $bill_start_date = Carbon::createFromFormat('Y-m-d', $search_submit_date['startDate'])->startOfDay();
                    $bill_end_date = Carbon::createFromFormat('Y-m-d', $search_submit_date['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                }

                if (isset($closedSearchValue['denial_code']) && !empty($closedSearchValue['denial_code'])) {
                    $claim_data->where('denial_code', $closedSearchValue['denial_code']);
                }

                $claim_data = $claim_data->get();

                foreach ($claim_data as $key => $claim_datas) {
                    $getStatusCode = Statuscode::where('id', $claim_datas['status_code'])->first();
                    $claim_data[$key]['statuscode'] = $getStatusCode->status_code ? $getStatusCode->status_code : 'NA';

                    $getSubStatusCode = Sub_statuscode::where('id', $claim_datas['substatus_code'])->first();
                    $claim_data[$key]['substatuscode'] = $getSubStatusCode->status_code ? $getSubStatusCode->status_code : 'NA';
                }
            } else if ($claim_type == "allocated") {
                $claimInfo = Claim_history::orderBy('id', 'desc')->get()->unique('claim_id')->toArray();
                // $claimQcInfos = Qc_note::where('error_type', '[4]')->orderBy('id', 'desc')->get(['claim_id'])->unique('claim_id')->toArray();

                foreach ($claimInfo as $claimList) {
                    if (isset($claimList) && $claimList['claim_state'] == 5 && $claimList['assigned_to'] == $user_id || $claimList['claim_state'] == 6)
                        array_push($assign, $claimList['claim_id']);
                }

                // foreach($claimQcInfos as $claimQcInfo){
                //   if(isset($claimQcInfo))
                //   array_push($assign, $claimQcInfo['claim_id']);
                // }

                $claim_data = Import_field::leftjoin(DB::raw("(SELECT claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                      AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                    $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin('qc_notes', 'import_fields.claim_no', '=', 'qc_notes.claim_id')->whereIN('claim_no', $assign)->where('claim_closing', '!=', 1);

                if (isset($assignSearchValue['acc_no']) && !empty($assignSearchValue['acc_no'])) {
                    $claim_data->where('acct_no', $assignSearchValue['acc_no']);
                }

                if (isset($assignSearchValue['claim_no']) && !empty($assignSearchValue['claim_no'])) {
                    $claim_data->where('claim_no', $assignSearchValue['claim_no']);
                }

                if (isset($assignSearchValue['dos']) && $assignSearchValue['dos']['startDate'] != null) {
                    $dos_start_date = Carbon::createFromFormat('Y-m-d', $assignSearchValue['dos']['startDate'])->startOfDay();
                    $dos_end_date = Carbon::createFromFormat('Y-m-d', $assignSearchValue['dos']['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                }

                if (isset($assignSearchValue['patient_name']) && !empty($assignSearchValue['patient_name'])) {
                    $claim_data->where('patient_name', 'LIKE', '%' . $assignSearchValue['patient_name'] . '%');
                }

                if (isset($assignSearchValue['responsibility']) && !empty($assignSearchValue['responsibility'])) {
                    $claim_data->where('responsibility', 'LIKE', '%' . $assignSearchValue['responsibility'] . '%');
                }

                if (isset($assignSearchValue['total_ar']) && !empty($assignSearchValue['total_ar'])) {
                    $OriginalString = trim($assignSearchValue['total_ar']);
                    $tot_ar = explode("-", $OriginalString);
                    $min_tot_ar = $tot_ar[0] - 1.00;
                    $max_tot_ar = $tot_ar[1];

                    $claim_data->whereBetween('total_ar', [$min_tot_ar, $max_tot_ar]);
                }

                if (isset($assignSearchValue['rendering_provider']) && !empty($assignSearchValue['rendering_provider'])) {
                    $claim_data->where('rendering_prov', 'LIKE', '%' . $assignSearchValue['rendering_provider'] . '%');
                }

                if (isset($assignSearchValue['payer_name']) && !empty($assignSearchValue['payer_name'])) {
                    $claim_data->where('prim_ins_name', 'LIKE', '%' . $assignSearchValue['payer_name'] . '%');
                    $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $assignSearchValue['payer_name'] . '%');
                    $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $assignSearchValue['payer_name'] . '%');
                }

                if (isset($assignSearchValue['date']) && $assignSearchValue['date']['startDate'] != null) {
                    $search_date = $assignSearchValue['date'];
                    $created_start_date = Carbon::createFromFormat('Y-m-d', $search_date['startDate'])->startOfDay();
                    $created_end_date = Carbon::createFromFormat('Y-m-d', $search_date['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(import_fields.created_at)'), '>=', $created_start_date)->where(DB::raw('DATE(import_fields.created_at)'), '<=', $created_end_date);
                }

                if (isset($assignSearchValue['age_filter']) && $assignSearchValue['age_filter'] != null) {
                    $search_age = $assignSearchValue['age_filter'];
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

                if (isset($assignSearchValue['bill_submit_date']) && $assignSearchValue['bill_submit_date']['startDate'] != null) {
                    $search_submit_date = $assignSearchValue['bill_submit_date'];
                    $bill_start_date = Carbon::createFromFormat('Y-m-d', $search_submit_date['startDate'])->startOfDay();
                    $bill_end_date = Carbon::createFromFormat('Y-m-d', $search_submit_date['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                }

                if (isset($assignSearchValue['denial_code']) && !empty($assignSearchValue['denial_code'])) {
                    $claim_data->where('denial_code', $assignSearchValue['denial_code']);
                }

                $claim_data = $claim_data->get();
            }

            if ($claim_data) {
                foreach ($claim_data as $key => $value) {
                    $dob = $claim_data[$key]['dos'];
                    $from = DateTime::createFromFormat('m/d/Y', date('m/d/Y', strtotime($dob)));

                    $to = date('d/m/Y');
                    $to = new DateTime;
                    $age = $to->diff($from);

                    $claim_data[$key]['age'] = $age->days;

                    $getExecutiveDate = Claim_history::where('claim_state', 4)->where('claim_id', $value['claim_no'])->latest()->select('created_at')->first();
                    $claim_data[$key]['executive_work_date'] = $getExecutiveDate->created_at ? date('m/d/Y', strtotime($getExecutiveDate->created_at)) : null;

                    $claim_data[$key]['touch'] = Claim_note::where('claim_id', $claim_data[$key]['claim_no'])->count();
                    $assigned_data = Action::where('claim_id', $claim_data[$key]['claim_no'])->orderBy('created_at', 'desc')->first();
                    if ($assigned_data != null) {
                        $assigned_to = User::where('id', $assigned_data['assigned_to'])->pluck('firstname');
                        $assigned_by = User::where('id', $assigned_data['assigned_by'])->pluck('firstname');

                        $assignedTo_size = sizeOf($assigned_to);
                        $assignedBy_size = sizeOf($assigned_by);

                        $claim_data[$key]['assigned_to'] = $assignedTo_size ? $assigned_to[0] : 'NA';
                        $claim_data[$key]['assigned_by'] = $assignedBy_size ? $assigned_by[0] : 'NA';
                        $claim_data[$key]['created'] = date('m/d/Y', strtotime($assigned_data['created_at']));
                        //   $claim_data[$key]['followup_date'] = date('m/d/Y', strtotime( $claim_data[$key]['followup_date']));
                        $date_format[0] = (int)date('d', strtotime($claim_data[$key]['followup_date']));
                        $date_format[1] = (int)date('m', strtotime($claim_data[$key]['followup_date']));
                        $date_format[2] = (int)date('Y', strtotime($claim_data[$key]['followup_date']));

                        $claim_data[$key]['followup_date'] = $date_format;
                    }
                }
            }

            $op_data['datas'] = $claim_data;
            return response()->json([
                'data' => $op_data,
                'odata' => $claim_data,
                'claims' => $claim_type,
                'cls'  => $pending,
            ]);
        } catch (Exception $e) {
            Log::debug('get audit claim details error: ' . $e->getMessage());
        }
    }

    //Get Auditor Details
    public function get_auditors(LoginRequest $request)
    {
        $users = User::whereIn('role_id', [2, 3, 4])->select('id', 'firstname', 'lastname')->get();
        $i = 0;
        foreach ($users as $auditor) {
            $claim_count = Import_field::where('assigned_to', $auditor['id'])->where('claim_Status', 'Auditing')->count();
            // $users[$i]['assigned_nos'] = $claim_count;
            $assign_limit = User_work_profile::where('user_id', $auditor['id'])->orderBy('id', 'desc')->first();
            // $users[$i]['assigned_claims'] = $claim_count;
            // $users[$i]['assign_limit'] = $assign_limit['claim_assign_limit'] ? $assign_limit['claim_assign_limit'] : 1;
            // $i++;
            if (isset($claim_count) && isset($assign_limit)) {
                $users[$i]['assigned_nos'] = $claim_count;
                $users[$i]['assigned_claims'] = $claim_count;
                $users[$i]['assign_limit'] = $assign_limit['claim_assign_limit'] ? $assign_limit['claim_assign_limit'] : 1;
                $i++;
            }

            //dd($assign_limit); echo "<br>";
        } //exit();

        return response()->json([
            'data' => $users
        ]);
    }





    public function fetch_export_data(LoginRequest $request)
    {

        $filter = $request->get('filter');
        $status_code = $request->get('status');
        $user_id = $request->get('user');


        /*The Values of User role and status code must be changed */

        //   $status_code= Statuscode::where('description','like', '%' . 'RCM Team' . '%')->get();

        $user_role = User::where('id', $user_id)->pluck('role_id');

        if ($user_role[0] == 5 || $user_role[0] == 3 || $user_role[0] == 2) {
            $claim_data = Import_field::where('claim_Status', 'Audit')->orWhere('claim_Status', 'Auditing')->orderBy('id', 'asc')->get();
        } else {
            $claim_data = Import_field::where('assigned_to', $user_id)->where('claim_Status', 'Auditing')->orderBy('id', 'desc')->get();
        }

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

            $assigned_to = User::where('id', $assigned_data['assigned_to'])->pluck('firstname');
            $assigned_by = User::where('id', $assigned_data['assigned_by'])->pluck('firstname');
            $claim_data[$key]['assigned_to_name'] = $assigned_to[0];
            $claim_data[$key]['assigned_by_name'] = $assigned_by[0];
            $claim_data[$key]['assigned_date'] = date('d/m/Y', strtotime($assigned_data['created_at']));
            $claim_data[$key]['touch'] = Claim_note::where('claim_id', $claim['claim_no'])->count();
        }

        return response()->json([
            'data'  => $claim_data
        ]);
    }

    public function get_audit_codes(LoginRequest $request)
    {
        $id = $request->get('id');

        $root_states = Root_cause::all();
        $error_type = Error_type::all();

        return response()->json([
            'root_states'  => $root_states,
            'err_types'  => $error_type
        ]);
    }

    public function auto_assign_claims(LoginRequest $request)
    {
        $id = $request->get('id');
        $users = User::where('role_id', '1')->pluck('id');
        //dd($users);
        $user_det = User_work_profile::whereIN('user_id', $users)->get();
        //dd($user_det);
        $sectable_nos = 0;
        $res = [];
        $j = 0;
        foreach ($user_det as $user) {
            //dd($user['id']);
            $result = [];
            $claim_worked = Import_field::where('followup_work_order', $user['id'])->get()->toArray();

            //dd($claim_worked);

            // dd($claim_worked);
            // print_r($user['id']); echo "</br>";

            $claim_worked_nos = sizeof($claim_worked);

            // dd($claim_worked_nos);

            if ($claim_worked_nos != 0 && $user['caller_benchmark'] != null) {
                $benchmark = $user['caller_benchmark'];
                $percentInDecimal = $benchmark / 100;
                //dd($benchmark);
                //dd($percentInDecimal);

                $sectable_nos = $percentInDecimal * $claim_worked_nos;
                if (round($sectable_nos) > 0) {
                    // dd(round($sectable_nos));

                    $test = round($sectable_nos);

                    $random_arrays = array_rand($claim_worked, round($sectable_nos));

                    //dd($random_arrays);
                    $op_array = [];

                    if (!is_array($random_arrays)) {
                        array_push($op_array, $claim_worked[$random_arrays]);
                    } else {
                        foreach ($random_arrays as $rand) {
                            array_push($op_array, $claim_worked[$rand]);
                        }
                    }


                    // dd($op_array);


                    $result['id'] = $user['id'];
                    $result['nos'] = round($sectable_nos);
                    $result['bm'] = $user['caller_benchmark'];
                    $result['wnos'] = $claim_worked_nos;
                    $result['workable_claims'] = $claim_worked;
                    $result['work_claims'] = $op_array;

                    array_push($res, $result);
                }
            }
        }

        return response()->json([
            'data'  => $res
        ]);
    }


    public function auto_assigned(LoginRequest $request)
    {

        $user_id = $request->get('user_id');
        $claim_id = $request->get('claim_id');

        $workorder_det = $request->get('work');
        $claim_det = $request->get('claim');
        $wo_type = $request->get('type');
        // dd($wo_type);
        $size = 0;

        $users = User::whereIN('role_id', [3, 4])->pluck('id');
        //dd($user);

        foreach ($users as $key => $user) {
            $claim_istory[$key]['id'] = $user;
            $claim_istory[$key]['count'] = Claim_history::where('assigned_to', $user)->where('claim_state', 5)->orderBy('id', 'DESC')->groupBy('assigned_by')->count();

            //$count[$key] = (isset($query[0]))?$query[0]->claim_id:0;
        }


        array_multisort(array_column($claim_istory, 'count'), SORT_ASC, $claim_istory);

        $assigned_id = $claim_istory[0]['id'];

        if ($wo_type == 'followup') {
            $action_type = 1;
            $work_order_type = 1;
            $claim_status = 'Assigned';
            $claim_state = 3;
            $users = User::where('role_id', array(1, 3, 2))->pluck('id');
        } else if ($wo_type == 'audit') {
            $action_type = 2;
            $work_order_type = 2;
            $claim_status = 'Auditing';
            $claim_state = 5;
            $users = User::where('role_id', array(4, 3, 2))->pluck('id');
        } else if ($wo_type == 'client_assistance') {
            $action_type = 3;
            $work_order_type = 3;
            $claim_status = 'CA Assigned';
            $claim_state = 7;
            $users = User::where('role_id', array(6, 3, 2))->pluck('id');
        } else if ($wo_type == 'rcm_team') {
            $action_type = 4;
            $work_order_type = 4;
            $claim_status = 'RCM Assigned';
            $claim_state = 8;
            $users = User::whereIN('role_id', array(7, 3, 2))->pluck('id');
        }

        $date = date('Y-m-d', strtotime($workorder_det['due_date']['day'] . '-' . $workorder_det['due_date']['month'] . '-' . $workorder_det['due_date']['year']));

        $workorder = Workorder_field::create([
            'work_order_name'       => $workorder_det['workorder_name'],
            'work_order_type'       => $work_order_type,
            'due_date'              => $date,
            'status'                => $claim_status,
            'priority'              => $workorder_det['priority'],
            'work_notes'            => $workorder_det['wo_notes'],
            'created_by'            => $user_id
        ]);


        $claim_assign = Workorder_user_field::create([
            'work_order_id'              => $workorder['id'],
            'user_id'                    => $assigned_id,
            'cliam_no'                   => json_encode($claim_id)
        ]);


        $claim_data = [];
        $i = 1;


        foreach ($claim_id as $claim) {
            $update_claim = DB::table('actions')->where('claim_id', $claim)->whereIn('assigned_to', $users)->update(array(
                'status'          =>  'Inactive'
            ));


            $action = Action::create([
                'claim_id'          => $claim,
                'action_id'         => $workorder['id'],
                'action_type'       => $action_type,
                'assigned_to'       => $assigned_id,
                'assigned_by'       => $user_id,
                'created_at'        => date('Y-m-d H:i:s'),
                'created_by'        => $user_id,
                'status'            => 'Active'
            ]);


            $Claim_history = Claim_history::create([
                'claim_id'          => $claim,
                'claim_state'       => $claim_state,
                'assigned_to'       => $assigned_id,
                'assigned_by'       => $user_id,
                'created_at'        => date('Y-m-d H:i:s')
            ]);


            if ($work_order_type == 1) {
                $update_claim = DB::table('import_fields')->where('claim_no', $claim)->update(array(
                    'claim_Status'          =>  $claim_status,
                    'assigned_to'           =>  $assigned_id,
                    'followup_work_order'   =>  $workorder['id']
                ));
            } else if ($work_order_type == 2) {
                $update_claim = DB::table('import_fields')->where('claim_no', $claim)->update(array(
                    'claim_Status'          =>  $claim_status,
                    'assigned_to'           =>  $assigned_id,
                    'audit_work_order'      =>  $workorder['id']
                ));
            } else if ($work_order_type == 3) {
                $update_claim = DB::table('import_fields')->where('claim_no', $claim)->update(array(
                    'claim_Status'          =>  $claim_status,
                    'assigned_to'           =>  $assigned_id,
                    'ca_work_order'         =>  $workorder['id']
                ));
            } else if ($work_order_type == 4) {
                $update_claim = DB::table('import_fields')->where('claim_no', $claim)->update(array(
                    'claim_Status'          =>  $claim_status,
                    'assigned_to'           =>  $assigned_id,
                    'rcm_work_order'        =>  $workorder['id']
                ));
            }



            $claim_data[$i] = ["claim_no" => $claim, "state" => $claim_state, "assigned_by" => $user_id, "assigned_to" => $assigned_id];
            $i++;
        }


        $size = sizeof($claim_data);

        return response()->json([
            'data'  => $claim_data
        ]);
    }

    public function audit_assigned_order_list(LoginRequest $request)
    {
        $user_id = $request->get('user_id');
        $page_no = $request->get('page_no');
        $page_count = $request->get('count');
        $claim_type = $request->get('claim_type');
        $sort_type = $request->get('sort_type');
        $sort_data = $request->get('sort_data');

        //dd($claim_type);
        $total_count = 0;
        $skip = ($page_no - 1) * $page_count;
        $end = $page_count;
        $op_data = [];
        $present_data = Config::get('fields.data');
        $field_data = [];
        foreach ($present_data as $key => $value) {
            $field_data[$value] = $key;
        }
        $op_data['fields'] = $field_data;
        $user_role = User::where('id', $user_id)->first();
        $claim_count = 0;
        /* if($user_role['role_id'] == 5 || $user_role['role_id'] == 3 || $user_role['role_id'] == 2)
        { */


        $worked = [];
        $pending = [];
        $clams = [];
        $assign = [];
        $closed = [];

        $claims = Action::where('assigned_to', $user_id)->where('action_type', 2)->where('status', 'Active')->get();
        //dd($claims);
        foreach ($claims as $active) {
            $date = date('Y-m-d', strtotime($active['created_at']));



            $allocated = Claim_history::where('claim_id', $active['claim_id'])->whereIN('claim_state', [4, 6, 7, 8, 9])->where('created_at', '>=', $date)->count();

            if ($allocated > 0) {
                array_push($worked, $active['claim_id']);
            } else {
                array_push($pending, $active['claim_id']);
            }
            // ->orderBy('created_at', 'desc')->distinct('claim_id')
        }


        if ($claim_type == "allocated") {
            $claimInfo = Claim_history::orderBy('id', 'desc')->get()->unique('claim_id')->toArray();

            foreach ($claimInfo as $claimList) {
                if (isset($claimList) && $claimList['claim_state'] == 5 && $claimList['assigned_to'] == $user_id)
                    array_push($assign, $claimList['claim_id']);
            }

            if ($sort_type == 'claim_no') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('claim_no', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('claim_no', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'dos') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('dos', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('dos', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'acct_no') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('acct_no', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('acct_no', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'patient_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('patient_name', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('patient_name', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'rendering_prov') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('rendering_prov', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('rendering_prov', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'responsibility') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('responsibility', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('responsibility', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'prim_ins_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('prim_ins_name', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('prim_ins_name', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'sec_ins_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('sec_ins_name', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('sec_ins_name', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'ter_ins_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('ter_ins_name', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('ter_ins_name', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'total_charges') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('total_charges', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('total_charges', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'total_ar') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('total_ar', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('total_ar', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'claim_Status') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('claim_Status', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('claim_Status', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'claim_note') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('claim_note', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('claim_note', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'assigned_to') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('assigned_to', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1)->orderBy('assigned_to', 'asc')->offset($skip)->limit($end)->get();
                }
            }



            $claim_count = Import_field::whereIN('claim_no', $assign)->count();
        } else if ($claim_type == "completed") {
            $claimInfo = Claim_history::orderBy('id', 'desc')->get()->unique('claim_id')->toArray();

            foreach ($claimInfo as $claimList) {

                if (isset($claimList) && $claimList['claim_state'] == 9 &&  $claimList['assigned_by'] == $user_id)
                    array_push($closed, $claimList['claim_id']);
            }

            if ($sort_type == 'claim_no') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('claim_no', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('claim_no', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'dos') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('dos', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('dos', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'acct_no') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('acct_no', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('acct_no', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'patient_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('patient_name', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('patient_name', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'rendering_prov') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('rendering_prov', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('rendering_prov', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'responsibility') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('responsibility', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('responsibility', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'prim_ins_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('prim_ins_name', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('prim_ins_name', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'sec_ins_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('sec_ins_name', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('sec_ins_name', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'ter_ins_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('ter_ins_name', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('ter_ins_name', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'total_charges') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('total_charges', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('total_charges', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'total_ar') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('total_ar', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('total_ar', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'claim_Status') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('claim_Status', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('claim_Status', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'claim_note') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('claim_note', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('claim_note', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'assigned_to') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('assigned_to', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->orderBy('assigned_to', 'asc')->offset($skip)->limit($end)->get();
                }
            }


            $claim_count = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1)->count();
        }


        if ($claim_count != 0) {


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
                    //   $claim_data[$key]['followup_date'] = date('m/d/Y', strtotime( $claim_data[$key]['followup_date']));
                    $date_format[0] = (int)date('d', strtotime($claim_data[$key]['followup_date']));
                    $date_format[1] = (int)date('m', strtotime($claim_data[$key]['followup_date']));
                    $date_format[2] = (int)date('Y', strtotime($claim_data[$key]['followup_date']));

                    $claim_data[$key]['followup_date'] = $date_format;
                }
            }
        }
        $op_data['datas'] = $claim_data;
        return response()->json([
            'data' => $op_data,
            'count' => $claim_count,
            'odata' => $claim_data,
            'claims' => $claim_type,
            'cls'  => $pending
        ]);
    }



    //Create Audit Work Order
    // public function create_audit_workorder(LoginRequest $request)
    // {
    //     $user_id=$request->get('id');
    //     $workorder_det=$request->get('assign_data');
    //     $claim_data;
    //     $i=1;
    //     foreach($workorder_det as $detail)
    //     {
    //         $auditor=$detail['auditor'];
    //         $claims=$detail['claims'];
    //         foreach($claims as $claim)
    //         {
    //             $update_claim=DB::table('import_fields')->where('claim_no',$claim)->update(array(
    //                 'claim_Status'          => 'Auditing',
    //                 'assigned_to'           =>  $auditor
    //                 ));
    //                 $claim_data[$i] = ["claim_no" => $claim, "state" => 5, "assigned_by" => $user_id, "assigned_to" => $auditor];
    //                 $i++;
    //                 }
    //                 }
    //                 $data= Record_claim_history::create_history($claim_data);
    //                  return response()->json([
    //                      'data' => $workorder_det
    //                      ]);
    //                      }


    public function get_error_param_codes(LoginRequest $request)
    {

        $id = $request->get('id');
        $error_param_type = ParentParameter::where('status', 1)->where('id', '<>', 5)->get();
        $fyi_param = ParentParameter::where('status', 1)->where('id', 5)->get();
        // $sub_error_param_type= ErrorParameter::select('id','error_sub_parameter')->where('status', 1)->get();

        return response()->json([
            'err_param_types'  => $error_param_type,
            'fyi_param_types'  => $fyi_param,
            //'sub_err_param_types'  => $sub_error_param_type,
        ]);
    }

    public function get_fyi_param_codes(LoginRequest $request)
    {
        $id = $request->get('id');
        $fyi_param_type = FYIParameter::select('id', 'fyi_parameter')->where('status', 1)->get();
        $fyi_sub_param_type = FYIParameter::select('id', 'fyi_sub_parameter')->where('status', 1)->get();

        return response()->json([
            'fyi_param_types'  => $fyi_param_type,
            'fyi_sub_param_types'  => $fyi_sub_param_type,
        ]);
    }


    public function get_sub_error_param_codes(LoginRequest $request)
    {
        $parent_id = $request->get('parent_id');
        $getSubParamCode = SubParameter::where('parent_id', $parent_id)->get();

        if ($getSubParamCode) {
            return Response::json(['status' => '200', 'sub_param_datas' => $getSubParamCode]);
        } else {
            return Response::json(['status' => '400', 'sub_param_datas' => $getSubParamCode]);
        }
    }
}
