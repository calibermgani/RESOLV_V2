<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\Action;
use App\Models\Claim_history;
use App\Models\Claim_note;
use App\Models\Client_note;
use App\Models\Error_type;
use App\Models\Followup_template;
use App\Models\Import_field;
use App\Models\Process_note;
use App\Models\Qc_note;
use App\Models\Statuscode;
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

class CreateworkorderController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['getclaim_details', 'process_note', 'getnotes', 'claim_note', 'qc_note', 'create_followup', 'get_followup', 'get_associates', 'create_workorder', 'check_claims', 'get_workorder', 'get_workorder_details', 'client_note', 'get_client_notes', 'fetch_wo_export_data', 'fetch_export_data', 'followup_process_notes_delete', 'audit_process_notes_delete', 'closed_followup_process_notes_delete', 'reasigned_followup_process_notes_delete', 'closed_audit_process_notes_delete', 'getclaim_details_order_list', 'team_claims', 'get_associate_name', 'getExecutiveList']]);
    }

    public function getclaim_details(LoginRequest $request)
    {
        try {
            $user_id = $request->get('user_id');
            $claim_type = $request->get('claim_type');

            $assignSearchValue = $request->get('assign_claim_searh');
            $reassignSearchValue = $request->get('reassign_claim_searh');
            $closedSearchValue = $request->get('closed_claim_searh');

            $practice_dbid = $request->get('practice_dbid');


            $op_data = [];
            $present_data = Config::get('fields.data');
            $field_data = [];
            foreach ($present_data as $key => $value) {
                $field_data[$value] = $key;
            }
            $op_data['fields'] = $field_data;


            $worked = [];
            $pending = [];

            $claims = Action::where('assigned_to', $user_id)->where('status', 'Active')->orderBy('id', 'desc')->groupBy('claim_id')->get();

            foreach ($claims as $active) {
                $date = date('Y-m-d', strtotime($active['created_at']));
                $allocated = Claim_history::where('claim_id', $active['claim_id'])->whereIN('claim_state', [9])->where('created_at', '>=', $date)->count();

                if ($allocated > 0) {
                    array_push($worked, $active['claim_id']);
                } else {
                    array_push($pending, $active['claim_id']);
                }
            }

            if ($claim_type == "wo") {
                $users = User::where('role_id', '1')->pluck('id');
                $claims = Action::whereIN('assigned_to', $users)->distinct('claim_id')->pluck('claim_id');

                $claim_data = Import_field::whereIN('claim_no', $claims)->get();
            } else if ($claim_type == "allocated") {
                $claim_data = Import_field::leftjoin(DB::raw("(SELECT claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE claim_notes.deleted_at IS NULL
                      AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                    $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                })->where('claim_status', 'Assigned')->where('assigned_to', $user_id)->where('followup_date', Null);

                if (isset($assignSearchValue['acc_no']) && !empty($assignSearchValue['acc_no'])) {
                    $claim_data->where('acct_no', $assignSearchValue['acc_no']);
                }

                if (isset($assignSearchValue['claim_no']) && !empty($assignSearchValue['claim_no'])) {
                    $claim_data->where('claim_no', $assignSearchValue['claim_no']);
                }

                if (isset($assignSearchValue['claim_no']) && !empty($assignSearchValue['claim_no'])) {
                    $claim_data->where('claim_no', $assignSearchValue['claim_no']);
                }

                if (isset($assignSearchValue['dos']) && $assignSearchValue['dos']['startDate'] != null) {
                    $dos_start_date = Carbon::createFromFormat('Y-m-d', $assignSearchValue['dos']['startDate'])->startOfDay();
                    $dos_end_date = Carbon::createFromFormat('Y-m-d', $assignSearchValue['dos']['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                }

                if (isset($assignSearchValue['date']) && $assignSearchValue['date']['startDate'] != null) {
                    $dos_start_date = Carbon::createFromFormat('Y-m-d', $assignSearchValue['date']['startDate'])->startOfDay();
                    $dos_end_date = Carbon::createFromFormat('Y-m-d', $assignSearchValue['date']['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $dos_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $dos_end_date);
                }

                if (!empty($assignSearchValue['age_filter']) && $assignSearchValue['age_filter']['from_age'] != null && $assignSearchValue['age_filter']['to_age'] != null) {
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

                if (isset($assignSearchValue['patient_name']) && !empty($assignSearchValue['patient_name'])) {
                    $claim_data->where('patient_name', 'LIKE', '%' . $assignSearchValue['patient_name'] . '%');
                }

                if (isset($assignSearchValue['total_charge']) && !empty($assignSearchValue['total_charge'])) {
                    $claim_data->where('total_charges', $assignSearchValue['total_charge']);
                }

                if (isset($assignSearchValue['total_ar']) && !empty($assignSearchValue['total_ar'])) {
                    $OriginalString = trim($assignSearchValue['total_ar']);
                    $tot_ar = explode("-", $OriginalString);

                    $min_tot_ar = $tot_ar[0] - 1.00;
                    $max_tot_ar = $tot_ar[1];

                    $claim_data->whereBetween('total_ar', [$min_tot_ar, $max_tot_ar]);
                }

                if (isset($assignSearchValue['claim_note']) && !empty($assignSearchValue['claim_note'])) {
                    $claim_data->where('claims_notes', 'LIKE', '%' . $assignSearchValue['claim_note'] . '%');
                }

                if (isset($assignSearchValue['payer_name']) && !empty($assignSearchValue['payer_name'])) {
                    $claim_data->where('prim_ins_name', 'LIKE', '%' . $assignSearchValue['payer_name'] . '%');
                    $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $assignSearchValue['payer_name'] . '%');
                    $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $assignSearchValue['payer_name'] . '%');
                }

                if (isset($assignSearchValue['denial_code']) && !empty($assignSearchValue['denial_code'])) {
                    $claim_data->where('denial_code', $assignSearchValue['denial_code']);
                }

                if (isset($assignSearchValue['bill_submit_date']) && $assignSearchValue['bill_submit_date']['startDate'] != null) {
                    $search_submit_date = $assignSearchValue['bill_submit_date'];
                    $bill_start_date = Carbon::createFromFormat('Y-m-d', $search_submit_date['startDate'])->startOfDay();
                    $bill_end_date = Carbon::createFromFormat('Y-m-d', $search_submit_date['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                }

                $claim_data = $claim_data->get();
            } else if ($claim_type == "completed") {
                $claim_data = Import_field::leftjoin(DB::raw("(SELECT claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                      AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                    $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                })->whereIN('claim_no', $worked)->where('claim_closing', 1);

                if (isset($closedSearchValue['acc_no']) && !empty($closedSearchValue['acc_no'])) {
                    $claim_data->where('acct_no', $closedSearchValue['acc_no']);
                }

                if (isset($closedSearchValue['claim_no']) && !empty($closedSearchValue['claim_no'])) {
                    $claim_data->where('claim_no', $closedSearchValue['claim_no']);
                }

                if (isset($closedSearchValue['claim_no']) && !empty($closedSearchValue['claim_no'])) {
                    $claim_data->where('claim_no', $closedSearchValue['claim_no']);
                }

                if (isset($closedSearchValue['dos']) && $closedSearchValue['dos']['startDate'] != null) {
                    $dos_start_date = Carbon::createFromFormat('Y-m-d', $closedSearchValue['dos']['startDate'])->startOfDay();
                    $dos_end_date = Carbon::createFromFormat('Y-m-d', $closedSearchValue['dos']['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                }

                if (isset($closedSearchValue['date']) && $closedSearchValue['date']['startDate'] != null) {
                    $dos_start_date = Carbon::createFromFormat('Y-m-d', $closedSearchValue['date']['startDate'])->startOfDay();
                    $dos_end_date = Carbon::createFromFormat('Y-m-d', $closedSearchValue['date']['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $dos_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $dos_end_date);
                }

                if (!empty($closedSearchValue['age_filter']) && $closedSearchValue['age_filter']['from_age'] != null && $closedSearchValue['age_filter']['to_age'] != null) {
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

                if (isset($closedSearchValue['patient_name']) && !empty($closedSearchValue['patient_name'])) {
                    $claim_data->where('patient_name', 'LIKE', '%' . $closedSearchValue['patient_name'] . '%');
                }

                if (isset($closedSearchValue['total_charge']) && !empty($closedSearchValue['total_charge'])) {
                    $claim_data->where('total_charges', $closedSearchValue['total_charge']);
                }

                if (isset($closedSearchValue['total_ar']) && !empty($closedSearchValue['total_ar'])) {
                    $OriginalString = trim($closedSearchValue['total_ar']);
                    $tot_ar = explode("-", $OriginalString);

                    $min_tot_ar = $tot_ar[0] - 1.00;
                    $max_tot_ar = $tot_ar[1];

                    $claim_data->whereBetween('total_ar', [$min_tot_ar, $max_tot_ar]);
                }

                if (isset($closedSearchValue['claim_note']) && !empty($closedSearchValue['claim_note'])) {
                    $claim_data->where('claims_notes', 'LIKE', '%' . $closedSearchValue['claim_note'] . '%');
                }

                if (isset($closedSearchValue['payer_name']) && !empty($closedSearchValue['payer_name'])) {
                    $claim_data->where('prim_ins_name', 'LIKE', '%' . $closedSearchValue['payer_name'] . '%');
                    $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $closedSearchValue['payer_name'] . '%');
                    $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $closedSearchValue['payer_name'] . '%');
                }

                if (isset($closedSearchValue['denial_code']) && !empty($closedSearchValue['denial_code'])) {
                    $claim_data->where('denial_code', $closedSearchValue['denial_code']);
                }

                if (isset($closedSearchValue['bill_submit_date']) && $closedSearchValue['bill_submit_date']['startDate'] != null) {
                    $search_submit_date = $closedSearchValue['bill_submit_date'];
                    $bill_start_date = Carbon::createFromFormat('Y-m-d', $search_submit_date['startDate'])->startOfDay();
                    $bill_end_date = Carbon::createFromFormat('Y-m-d', $search_submit_date['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                }

                $claim_data = $claim_data->get();
            } else if ($claim_type == "reallocated") {
                $claim_data = Import_field::leftjoin(DB::raw("(SELECT claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE claim_notes.deleted_at IS NULL
                        AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id )
                        as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })
                    ->leftjoin(DB::raw("(SELECT claim_histories.claim_id,claim_histories.created_at as created_ats FROM claim_histories
                        WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id)
                        as claim_histories"), function ($join) {
                        $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                    })
                    ->leftJoin('qc_notes', function ($join) {
                        $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                    })
                    ->whereIn('claim_status', ['Assigned', 'Client Assistance'])
                    ->where('followup_associate', $user_id)
                    ->whereIn('qc_notes.error_type', ['[2]', '[3]'])
                    ->whereNotNull('followup_date');

                if (isset($reassignSearchValue['acc_no']) && !empty($reassignSearchValue['acc_no'])) {
                    $claim_data->where('acct_no', $reassignSearchValue['acc_no']);
                }

                if (isset($reassignSearchValue['claim_no']) && !empty($reassignSearchValue['claim_no'])) {
                    $claim_data->where('claim_no', $reassignSearchValue['claim_no']);
                }

                if (isset($reassignSearchValue['claim_no']) && !empty($reassignSearchValue['claim_no'])) {
                    $claim_data->where('claim_no', $reassignSearchValue['claim_no']);
                }

                if (isset($reassignSearchValue['dos']) && $reassignSearchValue['dos']['startDate'] != null) {
                    $dos_start_date = Carbon::createFromFormat('Y-m-d', $reassignSearchValue['dos']['startDate'])->startOfDay();
                    $dos_end_date = Carbon::createFromFormat('Y-m-d', $reassignSearchValue['dos']['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                }

                if (isset($reassignSearchValue['date']) && $reassignSearchValue['date']['startDate'] != null) {
                    $dos_start_date = Carbon::createFromFormat('Y-m-d', $reassignSearchValue['date']['startDate'])->startOfDay();
                    $dos_end_date = Carbon::createFromFormat('Y-m-d', $reassignSearchValue['date']['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $dos_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $dos_end_date);
                }

                if (!empty($reassignSearchValue['age_filter']) && $reassignSearchValue['age_filter']['from_age'] != null && $reassignSearchValue['age_filter']['to_age'] != null) {
                    $search_age = $reassignSearchValue['age_filter'];
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

                if (isset($reassignSearchValue['patient_name']) && !empty($reassignSearchValue['patient_name'])) {
                    $claim_data->where('patient_name', 'LIKE', '%' . $reassignSearchValue['patient_name'] . '%');
                }

                if (isset($reassignSearchValue['total_charge']) && !empty($reassignSearchValue['total_charge'])) {
                    $claim_data->where('total_charges', $reassignSearchValue['total_charge']);
                }

                if (isset($reassignSearchValue['total_ar']) && !empty($reassignSearchValue['total_ar'])) {
                    $OriginalString = trim($reassignSearchValue['total_ar']);
                    $tot_ar = explode("-", $OriginalString);

                    $min_tot_ar = $tot_ar[0] - 1.00;
                    $max_tot_ar = $tot_ar[1];

                    $claim_data->whereBetween('total_ar', [$min_tot_ar, $max_tot_ar]);
                }

                if (isset($reassignSearchValue['claim_note']) && !empty($reassignSearchValue['claim_note'])) {
                    $claim_data->where('claims_notes', 'LIKE', '%' . $reassignSearchValue['claim_note'] . '%');
                }

                if (isset($reassignSearchValue['payer_name']) && !empty($reassignSearchValue['payer_name'])) {
                    $claim_data->where('prim_ins_name', 'LIKE', '%' . $reassignSearchValue['payer_name'] . '%');
                    $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $reassignSearchValue['payer_name'] . '%');
                    $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $reassignSearchValue['payer_name'] . '%');
                }

                if (isset($reassignSearchValue['denial_code']) && !empty($reassignSearchValue['denial_code'])) {
                    $claim_data->where('denial_code', $reassignSearchValue['denial_code']);
                }

                if (isset($reassignSearchValue['bill_submit_date']) && $reassignSearchValue['bill_submit_date']['startDate'] != null) {
                    $search_submit_date = $reassignSearchValue['bill_submit_date'];
                    $bill_start_date = Carbon::createFromFormat('Y-m-d', $search_submit_date['startDate'])->startOfDay();
                    $bill_end_date = Carbon::createFromFormat('Y-m-d', $search_submit_date['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                }

                $claim_data = $claim_data->get();
            }

            if (isset($claim_data)) {
                foreach ($claim_data as $key => $value) {
                    $dob = $claim_data[$key]['dos'];
                    $from = DateTime::createFromFormat('m/d/Y', date('m/d/Y', strtotime($dob)));

                    $to = date('d/m/Y');
                    $to = new DateTime;
                    $age = $to->diff($from);

                    $claim_data[$key]['age'] = $age->days;
                    $claim_data[$key]['touch'] = Claim_note::where('claim_id', @$claim_data[$key]['claim_no'])->count();

                    $assigned_data = Action::where('claim_id', @$claim_data[$key]['claim_no'])->orderBy('created_at', 'desc')->first();
                    if ($assigned_data != null) {
                        $assigned_to = User::where('id', $assigned_data['assigned_to'])->pluck('firstname');
                        $assigned_by = User::where('id', $assigned_data['assigned_by'])->pluck('firstname');
                        $claim_data[$key]['assigned_to'] = $assigned_to[0];
                        $claim_data[$key]['assigned_by'] = $assigned_by[0];
                        $claim_data[$key]['created'] = date('m-d-Y', strtotime($assigned_data['created_at']));

                        $date_format[0] = (int)date('d', strtotime(@$claim_data[$key]['followup_date']));
                        $date_format[1] = (int)date('m', strtotime(@$claim_data[$key]['followup_date']));
                        $date_format[2] = (int)date('Y', strtotime(@$claim_data[$key]['followup_date']));

                        $claim_data[$key]['followup_date'] = @$date_format;
                    }

                    $claim_data[$key]['created_ats'] = date('m/d/Y', strtotime($claim_data[$key]['created_ats']));
                }
            }

            $op_data['datas'] = $claim_data;

            return response()->json([
                'data' => $op_data,
            ]);
        } catch (Exception $e) {
            Log::debug('get claim details error' . $e->getMessage());
        }
    }

    public function process_note(LoginRequest $request)
    {
        $id = $request->get('userid');
        $notes = $request->get('process_note');
        $claim_status = $request->get('claim_status');
        $claim_data = $request->get('claim_det');
        $function = $request->get('func');
        if (isset($claim_data['claim_no'])) {
            $claim_no = $claim_data['claim_no'];
        }
        if ($function == "processcreate") {
            $notes_insert = Process_note::create(
                [
                    'claim_id'         => $claim_no,
                    'state'            => 'Active',
                    'content'          => $notes,
                    'created_by'       => $id
                ]
            );
        } else {
            $notes_update = DB::table('process_notes')->where('id', $claim_data)->update(array(
                'state'          => 'Edited',
                'content'        => $notes,
                'updated_by'     => $id,
                'updated_at'     => date('Y-m-d H:i:s')
            ));
            $claim_no = Process_note::where('id', $claim_data)->pluck('claim_id');
        }
        $process_note = Process_note::where('claim_id', $claim_no)->whereIn('state', ['Active', 'Edited'])->get()->toArray();
        foreach ($process_note as $key => $process) {
            $user = User::where('id', $process['created_by'])->pluck('firstname');
            $date = explode(" ", $process['created_at']);
            $process_note[$key]['create_Name'] = $user[0];
            $process_note[$key]['created_at'] = date('m-d-Y', strtotime($date[0]));
        }
        return response()->json([
            'data' => $process_note
        ]);
    }

    public function claim_note(LoginRequest $request)
    {
        $id = $request->get('userid');
        $notes = $request->get('claim_note');
        $claim_data = $request->get('claim_det');
        $function = $request->get('func');
        if (isset($claim_data['claim_no'])) {
            $claim_no = $claim_data['claim_no'];
        }
        if ($function == "claim_create") {
            $notes_insert = Claim_note::create(
                [
                    'claim_id'         => $claim_no,
                    'state'            => 'Active',
                    'content'          => $notes,
                    'created_by'       => $id
                ]
            );
        } else {
            $notes_update = DB::table('claim_notes')->where('id', $claim_data)->update(array(
                'state'          => 'Edited',
                'content'        => $notes,
                'updated_by'     => $id,
                'updated_at'     => date('Y-m-d H:i:s')
            ));

            $claim_no = Claim_note::where('id', $claim_data)->pluck('claim_id');
        }
        $claim_note = Claim_note::where('claim_id', $claim_no)->whereIn('state', ['Active', 'Edited'])->get()->toArray();

        foreach ($claim_note as $key => $data) {
            $user = User::where('id', $data['created_by'])->pluck('firstname');
            $date = explode(" ", $data['created_at']);

            $claim_note[$key]['create_Name'] = $user[0];
            $claim_note[$key]['created_at'] = date('m-d-Y', strtotime($date[0]));
        }
        return response()->json([
            'data' => $claim_note
        ]);
    }
    public function qc_note(LoginRequest $request)
    {
        $id = $request->get('userid');
        $notes_details = $request->get('qc_note');

        $notes = $notes_details['notes'];
        $notes_options = $notes_details['notes_opt'];

        /** Extra 4 Fields Added */
        $error_parameter_option = $notes_options['error_parameter'];
        $error_sub_parameter_option = $notes_options['error_sub_parameter'];
        $fyi_parameter_option = $notes_options['fyi_parameter'];
        $fyi_sub_parameter_option = $notes_options['fyi_sub_parameter'];



        $claim_data = $request->get('claim_det');
        $function = $request->get('func');
        $claim_no = @$claim_data['claim_no'];
        if ($function == "create_qcnotes") {
            $notes_insert = Qc_note::create(
                [
                    'claim_id'         => $claim_no,
                    'state'            => 'Active',
                    'content'          => $notes,
                    'root_cause'       => $notes_options['root_cause'],
                    'error_type'       => json_encode($notes_options['error_types']),
                    'error_parameter'  => $error_parameter_option,
                    'error_sub_parameter' => $error_sub_parameter_option,
                    'fyi_parameter'    => $fyi_parameter_option,
                    'fyi_sub_parameter' => $fyi_sub_parameter_option,
                    'created_by'       => $id
                ]
            );
        } else {
            $notes_update = DB::table('qc_notes')->where('id', $claim_data)->update(array(
                'state'          => 'Edited',
                'content'        => $notes,
                'root_cause'     => $notes_options['root_cause'],
                'error_type'     => json_encode($notes_options['error_types']),
                'error_parameter' => $error_parameter_option,
                'error_sub_parameter' => $error_sub_parameter_option,
                'fyi_parameter'    => $fyi_parameter_option,
                'fyi_sub_parameter' => $fyi_sub_parameter_option,
                'updated_by'     => $id,
                'updated_at'     => date('Y-m-d H:i:s')
            ));
            $claim_no = Qc_note::where('id', $claim_data)->pluck('claim_id');
        }

        // $qc_note= Qc_note::where('claim_id', $claim_no)->whereIn('state', ['Active', 'Edited']) ->get()->toArray();
        // foreach($qc_note as $key => $data)
        // {
        //     $user = User::where('id', $data['created_by'])->pluck('firstname');
        //     $date = explode(" ", $data['created_at']);
        //     $qc_note[$key]['create_Name']=$user[0];
        //     $qc_note[$key]['created_at'] = date('m-d-Y', strtotime($date[0]));
        // }


        $qc_note = Qc_note::with('root')->where('claim_id', $claim_no)
            ->whereIn('state', ['Active', 'Edited'])
            ->get()->toArray();

        foreach ($qc_note as $key => $data) {
            $user = User::where('id', $data['created_by'])->pluck('firstname');
            $date = explode(" ", $data['created_at']);
            $qc_note[$key]['create_Name'] = (sizeOf($user)) ? $user[0] : 'NA';
            // $qc_notes[$key]['create_Name']=$user[0];
            $qc_note[$key]['created_at'] = date('m-d-Y', strtotime($date[0]));
            $error_type = ltrim($data['error_type'], "[");
            $error_type = rtrim($error_type, "]");
            $qc_note[$key]['error_type'] = Error_type::whereRaw('id in (' . $error_type . ')')->get()->toArray();
        }
        //$notes['qc']=$qc_note;


        return response()->json([
            'data' => $qc_note
        ]);
    }

    public function getnotes(LoginRequest $request)
    {
        $notes = [];
        $claim_no = $request->get('claimid');
        //For Process Notes
        $process_note = Process_note::where('claim_id', $claim_no['claim_no'])
            ->whereIn('state', ['Active', 'Edited'])->get()->toArray();
        foreach ($process_note as $key => $process) {
            $user = User::where('id', $process['created_by'])->pluck('firstname');
            $date = explode(" ", $process['created_at']);
            $process_note[$key]['create_Name'] = (sizeOf($user)) ? $user[0] : 'NA';
            // $process_note[$key]['create_Name']=$user[0];
            $process_note[$key]['created_at'] = date('m-d-Y', strtotime($date[0]));
        }
        $notes['process'] = $process_note;

        //For Claim Notes
        $claim_notes = Claim_note::where('claim_id', $claim_no['claim_no'])
            ->whereIn('state', ['Active', 'Edited'])->get()->toArray();

        foreach ($claim_notes as $key => $data) {
            $user = User::where('id', $data['created_by'])->pluck('firstname');
            $date = explode(" ", $data['created_at']);
            $claim_notes[$key]['create_Name'] = (sizeOf($user)) ? $user[0] : 'NA';
            // $claim_notes[$key]['create_Name']=$user[0];
            $claim_notes[$key]['created_at'] = date('m-d-Y', strtotime($date[0]));
        }
        $notes['claim'] = $claim_notes;
        $salonID = ['2'];
        //For Qc Notes
        $qc_notes = Qc_note::with('root')->where('claim_id', $claim_no['claim_no'])
            ->whereIn('state', ['Active', 'Edited'])
            ->get()->toArray();

        foreach ($qc_notes as $key => $data) {
            $user = User::where('id', $data['created_by'])->pluck('firstname');
            $date = explode(" ", $data['created_at']);
            $qc_notes[$key]['create_Name'] = (sizeOf($user)) ? $user[0] : 'NA';
            // $qc_notes[$key]['create_Name']=$user[0];
            $qc_notes[$key]['created_at'] = date('m-d-Y', strtotime($date[0]));
            $error_type = ltrim($data['error_type'], "[");
            $error_type = rtrim($error_type, "]");
            $qc_notes[$key]['error_type'] = Error_type::whereRaw('id in (' . $error_type . ')')->get()->toArray();
        }
        $notes['qc'] = $qc_notes;

        //For Client Notes
        $client_notes = Client_note::where('claim_id', $claim_no['claim_no'])
            ->whereIn('state', ['Active', 'Edited'])->get()->toArray();

        foreach ($client_notes as $key => $data) {
            $user = User::where('id', $data['created_by'])->pluck('firstname');
            $date = explode(" ", $data['created_at']);
            $client_notes[$key]['create_Name'] = (sizeOf($user)) ? $user[0] : 'NA';
            // $client_notes[$key]['create_Name']=$user[0];
            $client_notes[$key]['created_at'] = date('m-d-Y', strtotime($date[0]));
        }
        $notes['client'] = $client_notes;

        return response()->json([
            'data' => $notes
        ]);
    }

    public function create_followup(LoginRequest $request)
    {
        $claim_id = $request->get('claim_no');
        $questions = $request->get('question_data');
        $form_data = $request->get('form_data');
        //dd($form_data);
        $entry_date = implode('-', $form_data['entry_date']);
        $entry_date = date('Y-m-d', strtotime($entry_date));

        $formdata_startDate = date('Y-m-d', strtotime($form_data['What_s_the_effective_date_of_policy_']['startDate']));

        $formdata_endDate = date('Y-m-d', strtotime($form_data['What_s_the_effective_date_of_policy_']['endDate']));

        //dd($formdata_startDate.'-'.$formdata_startDate);

        //$question_double_date = explode('-', $form_data['What_s_the_effective_date_of_policy_']);
        //dd($question_double_date);
        $user_id = $request->get('user_id');
        $category = $request->get('cat');
        $question_data = [];
        $i = 0;

        //dd($questions);

        foreach ($questions as $quest) {
            $question_data[$i]['question'] = $quest['question'];
            $question_data[$i]['hint'] = $quest['hint'];
            $question_data[$i]['question_label'] = $quest['question_label'];
            $answer = $form_data[$quest['question_label']];

            if ($quest['date_type'] == 'double_date') {
                //dd($question_double_date);
                $question_data[$i]['type'] = "date_range";
                // $from=date('Y-m-d',strtotime($question_double_date[0]));
                // if (isset($question_double_date[1])) {
                //     $to=date('Y-m-d',strtotime($question_double_date[1]));
                // }else{
                //     $to=date('Y-m-d',strtotime($question_double_date[0]));
                // }
                // dd($from, $to);

                $question_data[$i]['answer'] = $formdata_startDate . '-' . $formdata_startDate;
                // $date=date('Y-m-d',strtotime($form_data['entry_date']['endDate']));

            } else {
                $question_data[$i]['answer'] = $answer;
            }
            $i++;
        }

        // [{"question":"What's the effective date of policy?","hint":"EOD Policy","question_label":"What_s_the_effective_date_of_policy_","type":"date_range","answer":"2020-11-27 TO 2020-11-27"},{"question":"What's the filing limit?","hint":"Filing Limit","question_label":"What_s_the_filing_limit_","answer":"1"}]

        // $date = $from.'-'. $to;



        // $date=date('Y-m-d',strtotime($date));
        //dd($date);
        //dd($form_data['insurance']);
        //dd($entry_date);
        $followup_insert = Followup_template::create(
            [
                'claim_id'            => $claim_id,
                'rep_name'            => $form_data['rep_name'],
                'date'                => $entry_date,
                'phone'               => $form_data['phone'],
                'insurance'           => $form_data['insurance'],
                'category_id'         => $category,
                'content'             => json_encode($question_data),
                'created_by'          => $user_id
            ]
        );


        return response()->json([
            'data' => $question_data,
            'followup_insert' => $followup_insert,
            'message' => 'success'
        ]);
    }

    public function get_followup(LoginRequest $request)
    {
        $claim_id = $request->get('claim_no');
        $followup_data = Followup_template::where('claim_id', $claim_id)->get()->toArray();
        $content = [];
        foreach ($followup_data as $follow) {
            $content[$follow['id']] = json_decode($follow['content']);
        }
        $followup_data_op['data'] = $followup_data;
        $followup_data_op['content'] = $content;

        return response()->json([
            'data' => $followup_data_op
        ]);
    }

    public function get_associates(LoginRequest $request)
    {
        try{
            $users = User::whereIN('role_id', [1, 2, 3])->select('id', 'firstname', 'lastname')->limit(1)->get();
            $i = 0;
            foreach($users as $associates)
            {
                $assigned_count = Import_field::where('assigned_to', $associates['id'])->where('claim_Status', 'Assigned')->orWhere('claim_Status', 'Client Assistance')->count();
                $assign_limit = User_work_profile::where('user_id', $associates['id'])->orderBy('id', 'desc')->first();

                if(!empty($assigned_count) &&  !empty($assign_limit['claim_assign_limit'])){
                $users[$i]['assigned_claims'] = $assigned_count ? $assigned_count : 0;
                $users[$i]['assign_limit'] = $assign_limit['claim_assign_limit'];
                $i++;
                }
            }

            return response()->json([
                'data' => $users
            ]);

        }catch(Exception $e)
        {
            Log::debug('get associates error' . $e->getMessage());
            throw new Exception('get associates error' . $e->getMessage());
        }
    }


    public function get_associates1(LoginRequest $request)
    {

        // $users_filter = User_work_profile::where('practice_id',$request->get('practice_dbid'))->where('status','Active')->pluck('user_id');
        //    $users= User::whereIN('id', $users_filter)->select('id','firstname', 'lastname')->get();
        $users = User::whereIN('role_id', [1, 2, 3])->select('id', 'firstname', 'lastname')->get();



        $i = 0;
        /* $claims=Action::where('assigned_to', $user_id)->where('status','Active')->orderBy('id','desc')->groupBy('claim_id')->get();

            $Claim_history=Claim_history::where('assigned_to', $user_id)->orderBy('id','desc')->groupBy('claim_id')->pluck('claim_id')->toArray();
            $query = DB::table('claim_histories')
                        ->select(DB::raw("COUNT(claim_id) count, claim_id, id"))
                        ->whereIN('claim_id' , $Claim_history)
                        ->where('assigned_to' , $user_id)
                        ->havingRaw("COUNT(claim_id) = 1")
                        ->pluck('claim_id')->toArray();
            $claim_data[] = Import_field::whereIN('claim_no',  $query)->where('assigned_to', $user_id)->where('claim_status', 'Assigned')->get()->toArray(); */


        foreach ($users as $associates) {
            $Claim_history = Claim_history::where('assigned_to', $associates['id'])->orderBy('id', 'desc')->groupBy('claim_id')->get();

            foreach ($Claim_history as $key => $active) {
                $query = DB::table('claim_histories')
                    ->select(DB::raw("COUNT(claim_id) count, claim_id, id"))
                    ->where('claim_id', $active['claim_id'])
                    ->where('assigned_to', $associates['id'])
                    ->havingRaw("COUNT(claim_id) = 1")
                    ->get()->toArray();
                $count[$key] = (isset($query[0])) ? $query[0]->claim_id : 0;
            }

            if (isset($count)) {

                // foreach($count as $values){

                // $claim_data[] = Import_field::where('claim_no',  $values)->where('assigned_to', $associates['id'])->where('claim_status', 'Assigned')->get()->toArray();

                // }

                // $claim_array = array_filter(array_map('array_filter', $claim_data));

                // $multi_claim_data = $claim_array;

                // $merge_claim_data = array_reduce($multi_claim_data, 'array_merge', array());

                // $assign = array_column($merge_claim_data, 'claim_no');


                // $assigned_count= Import_field::leftjoin(DB::raw("(SELECT
                //         claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                //       AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function($join) { $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                //     })->whereIN('claim_no', $assign)->where('assigned_to', $associates['id'])->count();

                // $assigned_count = Import_field::leftJoin("claim_notes", "claim_notes.claim_id", "=", "import_fields.claim_no")
                // ->select('import_fields.*','claim_notes.claim_id','claim_notes.content as claims_notes')
                // ->groupBy('claim_notes.claim_id')
                // ->max('claim_notes.id')
                // ->whereIn('claim_no',$assign)
                // ->where('assigned_to', $associates['id'])->count();

                $assigned_count = Import_field::where('assigned_to', $associates['id'])->where('claim_Status', 'Assigned')->orWhere('claim_Status', 'Client Assistance')->count();

                $assign_limit = User_work_profile::where('user_id', $associates['id'])->orderBy('id', 'desc')->first();
                //dd($assign_limit);
                $users[$i]['assigned_claims'] = $assigned_count;
                $users[$i]['assign_limit'] = $assign_limit['claim_assign_limit'];
                $i++;
            }
        }
        return response()->json([
            'data' => $users
        ]);
    }


    public function get_associate_name(LoginRequest $request)
    {
        try {
            $user_id = $request->get('user_id');
            $user_name = User::select('id', 'user_name', 'firstname', 'lastname')->where('id', $user_id)->first();
            if ($user_name) {
                $user_details = array('status' => 200, 'user_detail' => $user_name);

                return Response::json($user_details);
            } else {
                $user_details = array('status' => 400, 'user_detail' => []);

                return Response::json($user_details);
            }
        } catch (Exception $e) {
            Log::debug($e->getMessage());
        }
    }

    public function create_workorder(LoginRequest $request)
    {
        $user_id = $request->get('id');
        $workorder_det = $request->get('work');
        $claim_det = $request->get('claim');
        $wo_type = $request->get('type');
        // dd($wo_type);
        $size = 0;

        // print_r($wo_type);

        // dd($claim_det);


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

        $workorder = Workorder_field::create(
            [
                'work_order_name'       => $workorder_det['workorder_name'],
                'work_order_type'       => $work_order_type,
                'due_date'              => $date,
                'status'                => $claim_status,
                'priority'              => $workorder_det['priority'],
                'work_notes'            => $workorder_det['wo_notes'],
                'created_by'            => $user_id
            ]
        );

        foreach ($claim_det as $value) {
            // dd($value['claims']);
            $claim_assign = Workorder_user_field::create([
                'work_order_id'              => $workorder['id'],
                'user_id'                    => $value['assigned_to'],
                'cliam_no'                   => json_encode($value['claims'])
            ]);

            $claim_data = [];
            $i = 1;

            foreach ($value['claims'] as $claim) {
                $update_claim = DB::table('actions')->where('claim_id', $claim)->whereIn('assigned_to', $users)->update(array(
                    'status'          =>  'Inactive'
                ));


                $action = Action::create([
                    'claim_id'          => $claim,
                    'action_id'         => $workorder['id'],
                    'action_type'       => $action_type,
                    'assigned_to'       => $value['assigned_to'],
                    'assigned_by'       => $user_id,
                    'created_at'        => date('Y-m-d H:i:s'),
                    'created_by'        => $user_id,
                    'status'            => 'Active'
                ]);

                $Claim_history = Claim_history::create([
                    'claim_id'          => $claim,
                    'claim_state'       => $claim_state,
                    'assigned_to'       => $value['assigned_to'],
                    'assigned_by'       => $user_id,
                    'created_at'        => date('Y-m-d H:i:s')
                ]);


                if ($work_order_type == 1) {
                    $update_claim = DB::table('import_fields')->where('claim_no', $claim)->update(array(
                        'claim_Status'          =>  $claim_status,
                        'assigned_to'           =>  $value['assigned_to'],
                        'followup_work_order'   =>  $workorder['id']
                    ));
                } else if ($work_order_type == 2) {
                    $update_claim = DB::table('import_fields')->where('claim_no', $claim)->update(array(
                        'claim_Status'          =>  $claim_status,
                        'assigned_to'           =>  $value['assigned_to'],
                        'audit_work_order'      =>  $workorder['id']
                    ));
                } else if ($work_order_type == 3) {
                    $update_claim = DB::table('import_fields')->where('claim_no', $claim)->update(array(
                        'claim_Status'          =>  $claim_status,
                        'assigned_to'           =>  $value['assigned_to'],
                        'ca_work_order'         =>  $workorder['id']
                    ));
                } else if ($work_order_type == 4) {
                    $update_claim = DB::table('import_fields')->where('claim_no', $claim)->update(array(
                        'claim_Status'          =>  $claim_status,
                        'assigned_to'           =>  $value['assigned_to'],
                        'rcm_work_order'        =>  $workorder['id']
                    ));
                }



                $claim_data[$i] = ["claim_no" => $claim, "state" => $claim_state, "assigned_by" => $user_id, "assigned_to" => $value['assigned_to']];
                $i++;
            }

            $size = sizeof($claim_data);
            // if(sizeof($claim_data) != 0)
            // {
            //     $data= Record_claim_history::create_history($claim_data);
            // }


        }


        return response()->json([
            'data' => $size,
            'message' => 'sucessfully',
        ]);
    }



    public function check_claims(LoginRequest $request)
    {
        $claim_nos = $request->get('claim');
        $users = [];
        // dd($claim_nos);

        foreach ($claim_nos as $value) {
            // $users[$value]= Action::where('claim_id', $value)->where('status', 'Active')->first();

            $import_det = Import_field::where('claim_no', $value)->get()->toArray();

            $import_data = Import_field::where('claim_no', $value)->first()->toArray();

            // echo '<pre>'; print_r($import_data['followup_work_order']);die;

            //if($import_data[0]['followup_work_order'] != 0 || $import_data[0]['followup_work_order'] != NULL )
            if ($import_data['followup_work_order'] != 0 || $import_data['followup_work_order'] != NULL) {
                $user_details = Workorder_user_field::where('work_order_id', $import_data['followup_work_order'])->get();



                $users[$value]['assigned_to'] = $user_details[0]['user_id'];
                $users[$value]['claim_id'] = $value;
            }
        }


        //dd($import_det);die;

        return response()->json([
            'data' => $users,
            'import_det' => $import_det
        ]);
    }


    public function get_workorder(LoginRequest $request)
    {
        try {
            $sort_type = $request->get('filter_type');
            $from = $request->get('from_date');
            $to = $request->get('to_date');
            $wo_type = $request->get('type');
            $page_no = $request->get('page');
            $sort_type_close = $request->get('sort_type');
            $sort_code = $request->get('sort_data');
            $sorting_method = $request->get('sorting_method');
            $sorting_name = $request->get('sorting_name');
            $searchValue = $request->get('closedClaimsFind');

            $wo_search = $request->get('workordersearch');

            // if ($searchValue != null) {
            //   $search_acc_no = $searchValue['acc_no'];
            //   $search_claim_no = $searchValue['claim_no'];
            //   $search_claim_note = $searchValue['claim_note'];
            //   $search_dos = $searchValue['dos'];
            //   $search_insurance = $searchValue['insurance'];
            //   $search_patient_name = $searchValue['patient_name'];
            //   $search_prim_ins_name = $searchValue['prim_ins_name'];
            //   $search_prim_pol_id = $searchValue['prim_pol_id'];
            //   $search_sec_ins_name = $searchValue['sec_ins_name'];
            //   $search_sec_pol_id = $searchValue['sec_pol_id'];
            //   $search_ter_ins_name = $searchValue['ter_ins_name'];
            //   $search_ter_pol_id = $searchValue['ter_pol_id'];
            //   $search_total_ar = $searchValue['total_ar'];
            //   $search_total_charge = $searchValue['total_charge'];
            // }

            $closed = [];

            if ($sort_type === 'closedClaims') {
                $claimInfo = Claim_history::orderBy('id', 'desc')->get()->unique('claim_id')->toArray();
                foreach ($claimInfo as $claimList) {
                    if (isset($claimList))
                        array_push($closed, $claimList['claim_id']);
                }

                $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                claim_notes.claim_id,claim_notes.content as claims_notes
                  FROM claim_notes WHERE claim_notes.deleted_at IS NULL
                  AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id
                  ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
                      claim_histories.claim_id,claim_histories.created_at as created_ats
                    FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                    ) as claim_histories"), function ($join) {
                    $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                })->with('Claim_history')->whereIN('claim_no', $closed)->where('claim_closing', 1)->orWhere('claim_Status', 'auto_close');

                if (isset($searchValue['acc_no']) && !empty($searchValue['acc_no'])) {
                    $claim_data->where('acct_no', $searchValue['acc_no']);
                }

                if (isset($searchValue['claim_no']) && !empty($searchValue['claim_no'])) {
                    $claim_data->where('claim_no', $searchValue['claim_no']);
                }

                if (isset($searchValue['claim_note']) && !empty($searchValue['claim_note'])) {
                    $claim_data->where('claim_note', 'LIKE', '%' . $searchValue['claim_note'] . '%');
                }

                if (isset($searchValue['dos']) && $searchValue['dos']['startDate'] != null) {
                    $dos_start_date = Carbon::createFromFormat('Y-m-d', $searchValue['dos']['startDate'])->startOfDay();
                    $dos_end_date = Carbon::createFromFormat('Y-m-d', $searchValue['dos']['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                }

                if (isset($searchValue['patient_name']) && !empty($searchValue['patient_name'])) {
                    $claim_data->where('patient_name', 'LIKE', '%' . $searchValue['patient_name'] . '%');
                }

                if (isset($searchValue['prim_ins_name']) && !empty($searchValue['prim_ins_name'])) {
                    $claim_data->where('prim_ins_name', 'LIKE', '%' . $searchValue['prim_ins_name'] . '%');
                }

                if (isset($searchValue['prim_pol_id']) && !empty($searchValue['prim_pol_id'])) {
                    $claim_data->where('prim_pol_id', 'LIKE', '%' . $searchValue['prim_pol_id'] . '%');
                }

                if (isset($searchValue['sec_ins_name']) && !empty($searchValue['sec_ins_name'])) {
                    $claim_data->where('sec_ins_name', 'LIKE', '%' . $searchValue['sec_ins_name'] . '%');
                }

                if (isset($searchValue['sec_pol_id']) && !empty($searchValue['sec_pol_id'])) {
                    $claim_data->where('sec_pol_id', 'LIKE', '%' . $searchValue['sec_pol_id'] . '%');
                }

                if (isset($searchValue['ter_ins_name']) && !empty($searchValue['ter_ins_name'])) {
                    $claim_data->where('ter_ins_name', 'LIKE', '%' . $searchValue['ter_ins_name'] . '%');
                }

                if (isset($searchValue['ter_pol_id']) && !empty($searchValue['ter_pol_id'])) {
                    $claim_data->where('ter_pol_id', 'LIKE', '%' . $searchValue['ter_pol_id'] . '%');
                }

                if (isset($searchValue['total_ar']) && !empty($searchValue['total_ar'])) {
                    $claim_data->where('total_ar', $searchValue['total_ar']);
                }

                if (isset($searchValue['total_charge']) && !empty($searchValue['total_charge'])) {
                    $claim_data->where('total_charges', $searchValue['total_charge']);
                }

                $claim_data = $claim_data->get();
                $current_total = $claim_data->count();

                if (isset($claim_data)) {
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
                            $claim_data[$key]['assigned_to'] = $assigned_to[0];
                            $claim_data[$key]['assigned_by'] = $assigned_by[0];
                            $claim_data[$key]['created'] = date('m/d/Y', strtotime($assigned_data['created_at']));

                            $date_format[0] = (int)date('m', strtotime($claim_data[$key]['followup_date']));
                            $date_format[1] = (int)date('d', strtotime($claim_data[$key]['followup_date']));
                            $date_format[2] = (int)date('Y', strtotime($claim_data[$key]['followup_date']));

                            $claim_data[$key]['followup_date'] = $date_format;
                        }

                        $claim_data[$key]['created_ats'] = date('m/d/Y', strtotime($claim_data[$key]['created_ats']));

                        //dd($claim_data[$key]['created_ats']);
                        $dos = strtotime($claim_data[$key]['dos']);

                        if (!empty($dos) && $dos != 0000 - 00 - 00 && $dos == 01 - 01 - 1970) {
                            $claim_data[$key]['dos'] = date('m-d-Y', $dos);
                        }

                        if ($dos == 0000 - 00 - 00) {
                            $claim_data[$key]['dos'] = 01 - 01 - 1970;
                        }

                        if ($dos == 01 - 01 - 1970) {
                            $claim_data[$key]['dos'] = 01 - 01 - 1970;
                        }
                    }
                }

                $op_data['datas'] = $claim_data;

                return response()->json([
                    'data'  => $op_data['datas'],
                    'current_total' => $current_total
                ]);
            } else {
                if ($wo_type) {
                    $work_orders = Workorder_field::where('work_order_type', $wo_type);

                    if (isset($wo_search['created_at']) && $wo_search['created_at']['startDate'] != null) {
                        $wo_due_sart_date = Carbon::createFromFormat('Y-m-d', $wo_search['created_at']['startDate'])->startOfDay();
                        $wo_due_end_date = Carbon::createFromFormat('Y-m-d', $wo_search['created_at']['endDate'])->endOfDay();

                        $work_orders->where(DB::raw('DATE(workorder_fields.created_at)'), '>=', $wo_due_sart_date)->where(DB::raw('DATE(workorder_fields.created_at)'), '<=', $wo_due_end_date);
                    }

                    if (isset($wo_search['due_date']) && $wo_search['due_date']['startDate'] != null) {
                        $wo_due_sart_date = Carbon::createFromFormat('Y-m-d', $wo_search['due_date']['startDate'])->startOfDay();
                        $wo_due_end_date = Carbon::createFromFormat('Y-m-d', $wo_search['due_date']['endDate'])->endOfDay();

                        $work_orders->where(DB::raw('DATE(workorder_fields.due_date)'), '>=', $wo_due_sart_date)->where(DB::raw('DATE(workorder_fields.due_date)'), '<=', $wo_due_end_date);
                    }


                    if (isset($wo_search['work_order_name']) && !empty($wo_search['work_order_name'])) {
                        $work_orders->where('work_order_name', 'LIKE', '%' . $wo_search['work_order_name'] . '%');
                    }

                    if (isset($wo_search['priority']) && !empty($wo_search['priority'])) {
                        $work_orders->where('priority', 'LIKE', '%' . $wo_search['priority'] . '%');
                    }

                    $work_orders = $work_orders->get();
                    $total = $work_orders->count();

                    $id = 0;
                    foreach ($work_orders as $key => $work) {
                        $claim_details = [];
                        $total_ar_due = 0.00;
                        $billed_amt = 0.00;
                        $assigned_claims = Action::where('action_id', $work['id'])->count();
                        $assigned_claim_details = Action::where('action_id', $work['id'])->get();

                        $due_date = strtotime($work_orders[$key]['due_date']);

                        if (!empty($due_date) && $due_date != 0000 - 00 - 00) {
                            $work_orders[$key]['due_date'] = date('m-d-Y', $due_date);
                        }

                        if ($due_date == 0000 - 00 - 00) {
                            $work_orders[$key]['due_date'] = 01 - 01 - 1970;
                        }

                        if ($due_date == 01 - 01 - 1970) {
                            $work_orders[$key]['due_date'] = 01 - 01 - 1970;
                        }


                        if ($assigned_claims != 0) {
                            foreach ($assigned_claim_details as $claims) {
                                $claim_details = Import_field::where('claim_no', $claims['claim_id'])->get();
                                if (sizeof($claim_details) != 0) {
                                    $total_ar_due += floatval($claim_details[0]['total_ar']);
                                    $billed_amt += floatval($claim_details[0]['total_charges']);
                                }
                            }
                        }


                        $created = User::where('id', $work['created_by'])->pluck('firstname');
                        if (sizeOf($created) == 0) {
                            $created = "NA";
                        } else {
                            $created = $created[0];
                        }
                        $work_orders[$id]['assigned_nos'] = $assigned_claims;
                        $work_orders[$id]['created'] = $created;
                        $work_orders[$id]['ar_due'] = $total_ar_due;
                        $work_orders[$id]['billed'] = $billed_amt;

                        $created_at = strtotime($work_orders[$key]['created_at']);

                        if (!empty($created_at) && $created_at != 0000 - 00 - 00) {
                            $work_orders[$id]['created_date'] = date('m-d-Y', $created_at);
                        }

                        if ($created_at == 0000 - 00 - 00) {
                            $work_orders[$key]['created_date'] = 01 - 01 - 1970;
                        }

                        if ($created_at == 01 - 01 - 1970) {
                            $work_orders[$key]['created_date'] = 01 - 01 - 1970;
                        }
                        $id++;
                    }

                    return response()->json([
                        'data'  => $work_orders,
                        'type'  =>  $sort_type,
                        'current_total' => $total
                    ]);
                }
            }
        } catch (Exception $e) {
            Log::debug('get_workorder error' . ' ' . $e->getMessage());
        }
    }

    //Get Details about selected Work Order
    public function get_workorder_details(LoginRequest $request)
    {
        $wo_claims = [];
        $wo_id = $request->get('wo_id');
        $work_order_details = Action::where('action_id', $wo_id)->get();
        // foreach($work_order_details as $wod)
        // {
        //     $claim_nos=json_decode($wod['cliam_no'],true);
        //     $assigned_to= User::where('id', $wod['user_id'])->pluck('firstname');
        foreach ($work_order_details as $claim) {

            $claim_data = Import_field::where('claim_no', $claim['claim_id'])->get();
            $assigned_name = User::where('id', $claim['assigned_to'])->pluck('firstname');
            $assigned_by = User::where('id', $claim['assigned_by'])->pluck('firstname');

            $assignedTo_size = sizeOf($assigned_name);
            $assignedTo_size = sizeOf($assigned_by);
            $claim_data[0]['assigned_to_name'] = $assignedTo_size ? $assigned_name[0] : 'NA';
            $claim_data[0]['assigned_by_name'] = $assignedTo_size ? $assigned_by[0] : 'NA';


            // $claim_data[0]['assigned_to_name']=$assigned_name[0];
            // $claim_data[0]['assigned_by_name']=$assigned_by[0];

            $date = explode(" ", $claim['created_at']);
            $claim_data[0]['assigned_date'] = date('d-m-Y', strtotime($date[0]));

            $claim_data[0]['touch_count'] = Claim_note::where('claim_id', $claim['claim_id'])->count();
            $status_code = Statuscode::where('id', $claim_data[0]['status_code'])->get();
            if (sizeof($status_code) == 0) {
                $status_code = 'Assigned';
            } else {
                $status_code = $status_code[0]['status_code'] . "-" . $status_code[0]['description'];
            }

            $dob = $claim_data[0]['dob'];
            $dob = date('Y-m-d', strtotime($dob));
            $age = 5;

            $workorder_create_date = date('Y-m-d', strtotime($claim['created_at']));

            $claim_data[0]['status_code'] = $status_code;
            $claim_data[0]['claim_age'] = $age;
            $claim_data[0]['created_at'] = $workorder_create_date;
            array_push($wo_claims, $claim_data[0]);
        }

        // }

        return response()->json([
            'data' => $wo_claims
        ]);
    }

    public function client_note(LoginRequest $request)
    {
        $id = $request->get('userid');
        $notes = $request->get('client_note');
        $claim_data = $request->get('claim_det');
        $function = $request->get('func');
        $claim_no = $claim_data['claim_no'];
        if ($function == "client_create") {
            $notes_insert = Client_note::create(
                [
                    'claim_id'         => $claim_no,
                    'state'            => 'Active',
                    'content'          => $notes,
                    'created_by'       => $id
                ]
            );
        } else {
            $notes_update = DB::table('client_notes')->where('id', $claim_data)->update(array(
                'state'          => 'Edited',
                'content'        => $notes,
                'updated_by'     => $id,
                'updated_at'     => date('Y-m-d H:i:s')
            ));
            $claim_no = Client_note::where('id', $claim_data)->pluck('claim_id');
        }
        $client_notes = Client_note::where('claim_id', $claim_no)->whereIn('state', ['Active', 'Edited'])->get()->toArray();
        foreach ($client_notes as $key => $client) {
            $user = User::where('id', $client['created_by'])->pluck('firstname');
            $date = explode(" ", $client['created_at']);
            $client_notes[$key]['create_Name'] = $user[0];
            $client_notes[$key]['created_at'] = date('m-d-Y', strtotime($date[0]));
        }
        return response()->json([
            'data' => $client_notes
        ]);
    }

    function fetch_wo_export_data(LoginRequest $request)
    {
        $sort_type = $request->get('filter_type');
        $status = $request->get('status');
        $user = $request->get('user');
        $wo_type = $request->get('wo');
        $sort_type = 0;
        if ($sort_type == 0) {
            $work_orders = Workorder_field::where('work_order_type', $wo_type)->get()->toArray();
        }
        $id = 0;
        foreach ($work_orders as $work) {

            $assigned_claims = Action::where('action_id', $work['id'])->count();
            // $assigned_claims=0;
            // foreach($work_order_details as $wo_det)
            // {

            //     $decoded=json_decode($wo_det['cliam_no'],true);
            //     $claim_count=count($decoded);
            //     $assigned_claims+=$claim_count;

            // }
            $date = explode(" ", $work['created_at']);
            $work_orders[$id]['created_date'] = date('d-m-Y', strtotime($date[0]));
            $created = User::where('id', $work['created_by'])->pluck('firstname');
            $work_orders[$id]['assigned_nos'] = $assigned_claims;
            $work_orders[$id]['created'] = $created[0];
            $id++;
        }
        return response()->json([
            'data'  => $work_orders
        ]);
    }

    public function fetch_export_data(LoginRequest $request)
    {

        $filter = $request->get('filter');
        $status_code = $request->get('status');
        $user_id = $request->get('user');


        /*The Values of User role and status code must be changed */

        // $status_code= Statuscode::where('description','like', '%' . 'RCM Team' . '%')->get();

        $user_role = User::where('id', $user_id)->pluck('role_id');

        if ($user_role[0] == 5 || $user_role[0] == 3 || $user_role[0] == 2) {
            $claim_data = Import_field::where('claim_Status', 'Assigned')->orderBy('id', 'asc')->get();
        } else {
            $claim_data = Import_field::where('assigned_to', $user_id)->where('claim_Status', 'Assigned')->orderBy('id', 'desc')->get();
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



    // function get_client_notes(LoginRequest $request)
    // {
    //     $claim_no=$request->get('claimid');
    //     //For Client Notes
    //     $client_notes= Client_note::
    //     where('claim_id', $claim_no)
    //   ->whereIn('state', ['Active', 'Edited']) ->get()->toArray();

    //   foreach($client_notes as $key => $data)
    //   {
    //     $user = User::where('id', $data['created_by'])->pluck('firstname');
    //     $date = explode(" ", $data['created_at']);
    //     $client_notes[$key]['create_Name']=$user[0];
    //     $client_notes[$key]['created_at'] = date('d/m/Y', strtotime($date[0]));
    //    }

    //     return response()->json([
    //         'data' => $client_notes
    //         ]);
    // }

    function followup_process_notes_delete(LoginRequest $request)
    {

        $claim_no = $request->get('claim_no');

        $user_id = $request->get('user_id');

        $proccess_claim_id = Process_note::where('claim_id', $claim_no)->where('created_by', $user_id)->where('claim_status', 'followup')->pluck('id');
        //dd($proccess_claim_id);

        $claim_claim_id = Claim_note::where('claim_id', $claim_no)->where('created_by', $user_id)->pluck('id');

        $proccess_note = Process_note::whereIN('id', $proccess_claim_id)->delete();

        // $client_note = Claim_note::whereIN('id', $claim_claim_id)->delete();

        return response()->json([
            'proccess_note' => $proccess_note, 'status' => 'success'
        ]);
    }


    function reasigned_followup_process_notes_delete(LoginRequest $request)
    {

        $claim_no = $request->get('claim_no');

        $user_id = $request->get('user_id');

        $proccess_claim_id = Process_note::where('claim_id', $claim_no)->where('created_by', $user_id)->where('claim_status', 'followupclosed')->pluck('id');
        //dd($proccess_claim_id);

        $claim_claim_id = Claim_note::where('claim_id', $claim_no)->where('created_by', $user_id)->pluck('id');

        $proccess_note = Process_note::whereIN('id', $proccess_claim_id)->delete();

        // $client_note = Claim_note::whereIN('id', $claim_claim_id)->delete();

        return response()->json([
            'proccess_note' => $proccess_note, 'status' => 'success'
        ]);
    }

    function closed_followup_process_notes_delete(LoginRequest $request)
    {

        $claim_no = $request->get('claim_no');

        $user_id = $request->get('user_id');

        $proccess_claim_id = Process_note::where('claim_id', $claim_no)->where('created_by', $user_id)->where('claim_status', 'followupclosed')->pluck('id');
        //dd($proccess_claim_id);

        $claim_claim_id = Claim_note::where('claim_id', $claim_no)->where('created_by', $user_id)->pluck('id');

        $proccess_note = Process_note::whereIN('id', $proccess_claim_id)->delete();

        //$client_note = Claim_note::whereIN('id', $claim_claim_id)->delete();

        return response()->json([
            'proccess_note' => $proccess_note,  'status' => 'success'
        ]);
    }


    function audit_process_notes_delete(LoginRequest $request)
    {

        $claim_no = $request->get('claim_no');

        $user_id = $request->get('user_id');

        $proccess_claim_id = Process_note::where('claim_id', $claim_no)->where('created_by', $user_id)->where('claim_status', 'audit')->pluck('id');
        //dd($proccess_claim_id);

        // $claim_claim_id = Claim_note::where('claim_id', $claim_no)->where('created_by', $user_id)->pluck('id');

        $proccess_note = Process_note::whereIN('id', $proccess_claim_id)->delete();

        //$client_note = Claim_note::whereIN('id', $claim_claim_id)->delete();

        return response()->json([
            'proccess_note' => $proccess_note, 'status' => 'success'
        ]);
    }



    function closed_audit_process_notes_delete(LoginRequest $request)
    {

        $claim_no = $request->get('claim_no');

        $user_id = $request->get('user_id');

        $proccess_claim_id = Process_note::where('claim_id', $claim_no)->where('created_by', $user_id)->where('claim_status', 'audit-closed')->pluck('id');
        //dd($proccess_claim_id);

        $claim_claim_id = Claim_note::where('claim_id', $claim_no)->where('created_by', $user_id)->pluck('id');

        $proccess_note = Process_note::whereIN('id', $proccess_claim_id)->delete();

        //$client_note = Claim_note::whereIN('id', $claim_claim_id)->delete();

        return response()->json([
            'proccess_note' => $proccess_note, 'status' => 'success'
        ]);
    }


    public function getclaim_details_order_list(LoginRequest $request)
    {

        $user_id = $request->get('user_id');
        $page_no = $request->get('page_no');
        $page_count = $request->get('count');
        $claim_type = $request->get('claim_type');
        $sort_type = $request->get('sort_type');
        $sort_data = $request->get('sort_data');

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
        // $user_role=User::where('id', $user_id)->first();

        $user_role = User_work_profile::where('user_id', $user_id)->orderBy('id', 'desc')->first();

        $claim_count = 0;

        //Getting using role ID

        //New Tabs Codes

        $worked = [];
        $pending = [];
        $assign = [];
        $reassign = [];

        //Work order Type
        // $action_type=Workorder_field::where('work_order_type',1)->whereIN('status',['InProgress','Assigned'])->pluck('id');

        // dd($user_id);
        $claims = Action::where('assigned_to', $user_id)->where('action_type', 1)->where('status', 'Active')->orderBy('id', 'desc')->groupBy('claim_id')->get();

        //dd($claims);

        $Claim_history = Claim_history::where('assigned_to', $user_id)->orderBy('id', 'desc')->groupBy('claim_id')->get();

        foreach ($claims as $active) {
            $date = date('Y-m-d', strtotime($active['created_at']));
            $allocated = Claim_history::where('claim_id', $active['claim_id'])->whereIN('claim_state', [9])->where('created_at', '>=', $date)->count();

            if ($allocated > 0) {
                array_push($worked, $active['claim_id']);
            } else {
                array_push($pending, $active['claim_id']);
            }
            // ->orderBy('created_at', 'desc')->distinct('claim_id')
        }

        if ($claim_type == "allocated") {
            foreach ($claims as $active) {

                $claimInfo = Claim_history::where('claim_id', $active['claim_id'])->orderBy('id', 'desc')->get()->unique('claim_id')->toArray();

                if (isset($claimInfo[0]) && $claimInfo[0]['claim_state'] == 3 && $claimInfo[0]['assigned_to'] == $user_id)
                    array_push($assign, $active['claim_id']);
            }

            if ($sort_type == 'claim_no') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('claim_no', 'desc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('claim_no', 'asc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                }
            } else if ($sort_type == 'acct_no') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('acct_no', 'desc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('acct_no', 'asc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                }
            } else if ($sort_type == 'dos') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('dos', 'desc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('dos', 'asc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                }
            } else if ($sort_type == 'patient_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('patient_name', 'desc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('patient_name', 'asc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                }
            } else if ($sort_type == 'rendering_prov') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('rendering_prov', 'desc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('rendering_prov', 'asc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                }
            } else if ($sort_type == 'responsibility') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('responsibility', 'desc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('responsibility', 'asc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                }
            } else if ($sort_type == 'prim_ins_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('prim_ins_name', 'desc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('prim_ins_name', 'asc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                }
            } else if ($sort_type == 'sec_ins_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('sec_ins_name', 'desc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('sec_ins_name', 'asc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                }
            } else if ($sort_type == 'ter_ins_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('ter_ins_name', 'desc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('ter_ins_name', 'asc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                }
            } else if ($sort_type == 'total_charges') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('total_charges', 'desc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('total_charges', 'asc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                }
            } else if ($sort_type == 'total_ar') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('total_ar', 'desc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('total_ar', 'asc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                }
            } else if ($sort_type == 'claim_Status') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('claim_Status', 'desc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('claim_Status', 'asc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                }
            } else if ($sort_type == 'claim_note') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('claim_note', 'desc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('claim_note', 'asc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                }
            } else if ($sort_type == 'assigned_to') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('assigned_to', 'desc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->orderBy('assigned_to', 'asc')->offset($skip)->limit($end)->get();
                    $current_total = $claim_data->count();
                }
            }


            // ->whereIN('claim_no', $pending) - temp removed


            $claim_count = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id)->count();
        } else if ($claim_type == "reallocated") {

            $claimInfo = Claim_history::orderBy('id', 'desc')->get()->unique('claim_id')->toArray();

            foreach ($claimInfo as $claimList) {

                if (isset($claimList) && $claimList['claim_state'] == 6 && $claimList['assigned_to'] == $user_id)
                    array_push($reassign, $claimList['claim_id']);
            }

            if ($sort_type == 'claim_no') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('claim_no', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('claim_no', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'dos') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('dos', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('dos', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'acct_no') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('acct_no', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('acct_no', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'patient_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('patient_name', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('patient_name', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'rendering_prov') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('rendering_prov', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('rendering_prov', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'responsibility') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('responsibility', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('responsibility', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'prim_ins_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('prim_ins_name', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('prim_ins_name', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'sec_ins_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('sec_ins_name', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('sec_ins_name', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'ter_ins_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('ter_ins_name', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('ter_ins_name', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'total_charges') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('total_charges', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('total_charges', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'total_ar') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('total_ar', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('total_ar', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'claim_Status') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('claim_Status', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('claim_Status', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'claim_note') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('claim_note', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('claim_note', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'assigned_to') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('assigned_to', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $reassign)->where('assigned_to', $user_id)->orderBy('assigned_to', 'asc')->offset($skip)->limit($end)->get();
                }
            }


            // $claim_data= Import_field::whereIN('claim_no',$reassign)-> offset($skip) ->limit($end)->get();
            $claim_count = Import_field::whereIN('claim_no', $reassign)->count();
        } else if ($claim_type == "completed") {


            if ($sort_type == 'claim_no') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('claim_no', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('claim_no', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'dos') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('dos', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('dos', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'acct_no') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('acct_no', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('acct_no', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'patient_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('patient_name', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('patient_name', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'rendering_prov') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('rendering_prov', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('rendering_prov', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'responsibility') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('responsibility', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('responsibility', 'desc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'prim_ins_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('prim_ins_name', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('prim_ins_name', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'sec_ins_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('sec_ins_name', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('sec_ins_name', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'ter_ins_name') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('ter_ins_name', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('ter_ins_name', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'total_charges') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('total_charges', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('total_charges', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'total_ar') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('total_ar', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('total_ar', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'claim_Status') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('claim_Status', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('claim_Status', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'assigned_to') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('assigned_to', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('assigned_to', 'asc')->offset($skip)->limit($end)->get();
                }
            } else if ($sort_type == 'claim_note') {
                if ($sort_data == true) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('claim_note', 'desc')->offset($skip)->limit($end)->get();
                } else if ($sort_data == false) {
                    $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->orderBy('claim_note', 'asc')->offset($skip)->limit($end)->get();
                }
            }


            $claim_count = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1)->count();
        }

        if (isset($claim_data)) {
            //dd('dsad');
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
                    $claim_data[$key]['assigned_to'] = $assigned_to[0];
                    $claim_data[$key]['assigned_by'] = $assigned_by[0];
                    $claim_data[$key]['created'] = date('d/m/Y', strtotime($assigned_data['created_at']));

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
            'current_total' => $current_total,
            'skip' => $skip,
        ]);
    }


    public function team_claims(LoginRequest $request)
    {
        return response()->json([
            'value_return' => "Get All claim response",

        ]);
    }


    public function getExecutiveList(LoginRequest $request)
    {
        try {
            $practice_dbid = $request->get('practice_dbid');
            $users = User::select('id', 'user_name', 'firstname', 'lastname')->where('role_id', 1)->get();
            if ($users) {
                return response()->json([
                    'status' => 200,
                    'user_list' => $users
                ]);
            } else {
                return response()->json([
                    'status' => 204,  //No Content
                    'user_list' => []
                ]);
            }
        } catch (Exception $e) {
            log::debug('executive list error : ' . $e->getMessage());
        }
    }
}
