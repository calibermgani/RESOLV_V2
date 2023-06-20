<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\Action;
use App\Models\Claim_history;
use App\Models\Import_field;
use App\Models\User;
use App\Models\Workorder_field;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExportController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['fetch_create_claims_export_data', 'fetch_followup_claims_export_data', 'fetch_audit_claims_export_data', 'fetch_billing_claims_export_data', 'fetch_client_claims_export_data', 'fetch_work_order_export_data', 'fetch_create_claims_export_data_pdf', 'fetch_followup_claims_export_data_pdf', 'fetch_audit_claims_export_data_pdf', 'fetch_billing_claims_export_data_pdf', 'fetch_client_claims_export_data_pdf', 'fetch_work_order_export_data_pdf']]);
    }

    public function fetch_create_claims_export_data(LoginRequest $request)
    {

        $user_id = $request->get('user_id');
        $table_name = $request->get('table_name');
        $search = $request->get('search');
        $searchValue = $request->get('searchClaims');

        $excel_Name = 'Claims-' . $table_name;

        if ($searchValue != null) {
            $search_acc_no = $searchValue['acc_no'];
            $search_claim_no = $searchValue['claim_no'];
            $search_claim_note = $searchValue['claim_note'];
            $search_dos = $searchValue['dos'];
            $search_insurance = $searchValue['insurance'];
            $search_patient_name = $searchValue['patient_name'];
            $search_prim_ins_name = $searchValue['prim_ins_name'];
            $search_prim_pol_id = $searchValue['prim_pol_id'];
            $search_sec_ins_name = $searchValue['sec_ins_name'];
            $search_sec_pol_id = $searchValue['sec_pol_id'];
            $search_ter_ins_name = $searchValue['ter_ins_name'];
            $search_ter_pol_id = $searchValue['ter_pol_id'];
            $search_total_ar = $searchValue['total_ar'];
            $search_total_charge = $searchValue['total_charge'];
            $search_responsibility = $searchValue['responsibility'];
            $search_rendering_provider = $searchValue['rendering_provider'];
            $search_dates = $searchValue['date'];
        }

        $wo_search = $request->get('workordersearch');

        //dd($wo_search);

        if ($wo_search != null) {

            $wo_search_created_at = $wo_search['created_at'];
            $wo_search_due_date = $wo_search['due_date'];
            $wo_search_priority = $wo_search['priority'];
            $wo_search_work_order_name = $wo_search['work_order_name'];
        }

        $closed = [];

        if ($table_name == 'Create_work_order_claims') {

            if (empty($search)) {
                $claim_data = Import_field::whereNull('followup_work_order');
            } else {
                $claim_data = Import_field::whereNull('followup_work_order');

                if (!empty($search_claim_no)) {
                    $claim_data->where('claim_no', $search_claim_no);
                }
                if (!empty($search_acc_no)) {
                    $claim_data->where('acct_no', $search_acc_no);
                }
                if (!empty($search_claim_note)) {
                    $claim_data->where('claim_note', 'LIKE', '%' . $search_claim_note . '%');
                }

                if (isset($searchValue['dos']) && $searchValue['dos']['startDate'] != null) {
                    $dos_sart_date = Carbon::createFromFormat('Y-m-d', $searchValue['dos']['startDate'])->startOfDay();
                    $dos_end_date = Carbon::createFromFormat('Y-m-d', $searchValue['dos']['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                }

                if (!empty($search_patient_name)) {
                    $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                }

                if (!empty($search_responsibility)) {
                    $claim_data->where('responsibility', 'LIKE', '%' . $search_responsibility . '%');
                }

                if (isset($searchValue['age_filter']) && $searchValue['age_filter'] != null) {
                    $search_age = $searchValue['age_filter'];
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

                if (!empty($search_rendering_provider)) {
                    $claim_data->where('rendering_provider', 'LIKE', '%' . $search_rendering_provider . '%');
                }

                if (isset($searchValue['payer_name']) && !empty($searchValue['payer_name'])) {
                    $claim_data->where('prim_ins_name', 'LIKE', '%' . $searchValue['payer_name'] . '%');
                    $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $searchValue['payer_name'] . '%');
                    $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $searchValue['payer_name'] . '%');
                }

                if (isset($searchValue['date']) && $searchValue['date']['startDate'] != null) {
                    $search_dates = $searchValue['date'];
                    $created_start_date = Carbon::createFromFormat('Y-m-d', $search_dates['startDate'])->startOfDay();
                    $created_end_date = Carbon::createFromFormat('Y-m-d', $search_dates['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(import_fields.created_at)'), '>=', $created_start_date)->where(DB::raw('DATE(import_fields.created_at)'), '<=', $created_end_date);
                }

                if (isset($searchValue['bill_submit_date']) && $searchValue['bill_submit_date']['startDate'] != null) {
                    $search_submit_date = $searchValue['bill_submit_date'];
                    $bill_start_date = Carbon::createFromFormat('Y-m-d', $search_submit_date['startDate'])->startOfDay();
                    $bill_end_date = Carbon::createFromFormat('Y-m-d', $search_submit_date['endDate'])->endOfDay();

                    $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                }

                if (isset($searchValue['denial_code']) && !empty($searchValue['denial_code'])) {
                    $claim_data->where('denial_code', $searchValue['denial_code']);
                }

                // if(!empty($search_prim_ins_name)){
                //   $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                // }
                if (!empty($search_prim_pol_id)) {
                    $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                }
                // if(!empty($search_sec_ins_name)){
                //   $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                // }
                if (!empty($search_sec_pol_id)) {
                    $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                }
                // if(!empty($search_ter_ins_name)){
                //   $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                // }
                if (!empty($search_ter_pol_id)) {
                    $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                }
                // if(!empty($search_total_ar)){
                //   $claim_data->where('total_ar', 'LIKE', '%' . $search_total_ar . '%');
                // }

                if (isset($search_total_ar) && !empty($search_total_ar)) {
                    $OriginalString = trim($search_total_ar);
                    $tot_ar = explode("-", $OriginalString);
                    $min_tot_ar = $tot_ar[0] - 1.00;
                    $max_tot_ar = $tot_ar[1];

                    $claim_data->whereBetween('total_ar', [$min_tot_ar, $max_tot_ar]);
                }

                if (!empty($search_total_charge)) {
                    $claim_data->where('total_charge', $search_total_charge);
                }

                $claim_data->where('claim_Status', Null);
            }
        } elseif ($table_name == 'Closed_claims') {

            $claimInfo = Claim_history::orderBy('id', 'desc')->get()->unique('claim_id')->toArray();

            foreach ($claimInfo as $claimList) {

                if (isset($claimList))
                    array_push($closed, $claimList['claim_id']);
            }

            if (empty($search)) {
                $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1);
            } else {

                $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1);

                if (!empty($search_claim_no)) {
                    $claim_data->where('claim_no', $search_claim_no);
                }
                if (!empty($search_acc_no)) {
                    $claim_data->where('acct_no', $search_acc_no);
                }
                if (!empty($search_claim_note)) {
                    $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                }
                if (!empty($search_dos)) {

                    $search_date = explode('-', $search_dos);
                    $dos_sart_date = date('Y-m-d', strtotime($search_date[0]));
                    $dos_end_date = date('Y-m-d', strtotime($search_date[1]));

                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                }
                if (!empty($search_patient_name)) {
                    $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                }
                if (!empty($search_prim_ins_name)) {
                    $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                }
                if (!empty($search_prim_pol_id)) {
                    $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                }
                if (!empty($search_sec_ins_name)) {
                    $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                }
                if (!empty($search_sec_pol_id)) {
                    $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                }
                if (!empty($search_ter_ins_name)) {
                    $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                }
                if (!empty($search_ter_pol_id)) {
                    $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                }
                if (!empty($search_total_ar)) {
                    $claim_data->where('total_ar', 'LIKE', '%' . $search_total_ar . '%');
                }
                if (!empty($search_total_charge)) {
                    $claim_data->where('total_charge', 'LIKE', '%' . $search_total_charge . '%');
                }
            }
        } elseif ($table_name == 'Work_order_claims') {

            $wo_type = 1;

            if (empty($search)) {
                $claim_data = Workorder_field::where('work_order_type', $wo_type);
            } else {

                $claim_data = Workorder_field::where('work_order_type', $wo_type);

                if (!empty($search_claim_no)) {
                    $claim_data->where('claim_no', $search_claim_no);
                }
                if (!empty($search_acc_no)) {
                    $claim_data->where('acct_no', $search_acc_no);
                }
                if (!empty($search_claim_note)) {
                    $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                }
                if (!empty($search_dos)) {

                    $search_date = explode('-', $search_dos);
                    $dos_sart_date = date('Y-m-d', strtotime($search_date[0]));
                    $dos_end_date = date('Y-m-d', strtotime($search_date[1]));

                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                }
                if (!empty($search_patient_name)) {
                    $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                }
            }
        }

        $claim_data->leftjoin(DB::raw("(SELECT process_notes.claim_id,process_notes.content as process_notes FROM process_notes
          WHERE process_notes.deleted_at IS NULL AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
          GROUP BY process_notes.claim_id ) as process_notes"), function ($join) {
            $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
        });

        $claim_data->leftjoin(DB::raw("(SELECT qc_notes.claim_id,qc_notes.content as qc_notes FROM qc_notes
          WHERE qc_notes.deleted_at IS NULL AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
          GROUP BY qc_notes.claim_id ) as qc_notes"), function ($join) {
            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
        });

        $claim_data->leftjoin(DB::raw("(SELECT claim_notes.claim_id,claim_notes.content as claims_notes
          FROM claim_notes WHERE claim_notes.deleted_at IS NULL
          AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
          GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
        });

        $claim_data = $claim_data->get()->toArray();

        foreach ($claim_data as $key => $value) {
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

            $dos = strtotime($claim_data[$key]['dos']);

            if (!empty($dos) && $dos != 0000 - 00 - 00 && $dos != 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', $dos);
            }

            if ($dos == 0000 - 00 - 00) {
                $claim_data[$key]['dos'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $dob = strtotime($claim_data[$key]['dob']);

            if (!empty($dob) && $dob != 0000 - 00 - 00 && $dob != 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', $dob);
            }

            if ($dob == 0000 - 00 - 00) {
                $claim_data[$key]['dob'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dob == 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $admit_date = strtotime($claim_data[$key]['admit_date']);

            if (!empty($admit_date) && $admit_date != 0000 - 00 - 00 && $admit_date != 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', $admit_date);
            }

            if ($admit_date == 0000 - 00 - 00) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($admit_date == 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $discharge_date = strtotime($claim_data[$key]['discharge_date']);

            if (!empty($discharge_date) && $discharge_date != 0000 - 00 - 00 && $discharge_date != 1970 - 01 - 01) {

                $claim_data[$key]['discharge_date'] = date('m/d/Y', $discharge_date);
            }

            if ($discharge_date == 0000 - 00 - 00) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($discharge_date == 1970 - 01 - 01) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $total_ar = $claim_data[$key]['total_ar'];

            $claim_data[$key]['total_ar'] = number_format((float)$total_ar, 2, '.', '');

            $total_charges = $claim_data[$key]['total_charges'];

            $claim_data[$key]['total_charges'] = number_format((float)$total_charges, 2, '.', '');

            $pat_ar = $claim_data[$key]['pat_ar'];

            $claim_data[$key]['pat_ar'] = number_format((float)$pat_ar, 2, '.', '');

            $ins_ar = $claim_data[$key]['ins_ar'];

            $claim_data[$key]['ins_ar'] = number_format((float)$ins_ar, 2, '.', '');
        }

        return response()->json([
            'data'  => $claim_data,
            'table' => $excel_Name
        ]);
    }


    public function fetch_followup_claims_export_data(LoginRequest $request)
    {

        $user_id = $request->get('user_id');
        $table_name = $request->get('table_name');
        $search = $request->get('search');
        $searchValue = $request->get('searchClaims');

        $excel_name = 'Followup- ' . $table_name;

        if ($searchValue != null) {
            $search_acc_no = $searchValue['acc_no'];
            $search_claim_no = $searchValue['claim_no'];
            $search_claim_note = $searchValue['claim_note'];
            $search_dos = $searchValue['dos'];
            $search_insurance = $searchValue['insurance'];
            $search_patient_name = $searchValue['patient_name'];
            $search_prim_ins_name = $searchValue['prim_ins_name'];
            $search_prim_pol_id = $searchValue['prim_pol_id'];
            $search_sec_ins_name = $searchValue['sec_ins_name'];
            $search_sec_pol_id = $searchValue['sec_pol_id'];
            $search_ter_ins_name = $searchValue['ter_ins_name'];
            $search_ter_pol_id = $searchValue['ter_pol_id'];
            $search_total_ar = $searchValue['total_ar'];
            $search_total_charge = $searchValue['total_charge'];
        }

        $worked = [];
        $pending = [];
        $assign = [];
        $reassign = [];

        if ($table_name == 'Assigned_claims') {

            $Claim_history = Claim_history::where('assigned_to', $user_id)->orderBy('id', 'desc')->groupBy('claim_id')->get();

            foreach ($Claim_history as $key => $active) {
                $query = DB::table('claim_histories')
                    ->select(DB::raw("COUNT(claim_id) count, claim_id, id"))
                    ->where('claim_id', $active['claim_id'])
                    ->where('assigned_to', $user_id)
                    ->havingRaw("COUNT(claim_id) = 1")
                    ->get()->toArray();
                $count[$key] = (isset($query[0])) ? $query[0]->claim_id : 0;
            }

            $array = [];

            foreach ($count as $values) {

                $claim_data[] = Import_field::where('claim_no',  $values)->where('assigned_to', $user_id)->where('claim_status', 'Assigned')->get()->toArray();
            }
            $claim_array = array_filter(array_map('array_filter', $claim_data));

            $multi_claim_data = $claim_array;

            $merge_claim_data = array_reduce($multi_claim_data, 'array_merge', array());

            $assign = array_column($merge_claim_data, 'claim_no');


            if (empty($search)) {
                $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id);
            } else {

                $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id);

                if (!empty($search_claim_no)) {
                    $claim_data->where('claim_no', 'LIKE', '%' . $search_claim_no . '%');
                }
                if (!empty($search_acc_no)) {
                    $claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');
                }
                if (!empty($search_claim_note)) {
                    $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                }
                if (!empty($search_dos)) {

                    $search_date = explode('-', $search_dos);
                    $dos_sart_date = date('Y-m-d', strtotime($search_date[0]));
                    $dos_end_date = date('Y-m-d', strtotime($search_date[1]));

                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                }
                if (!empty($search_patient_name)) {
                    $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                }
                if (!empty($search_prim_ins_name)) {
                    $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                }
                if (!empty($search_prim_pol_id)) {
                    $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                }
                if (!empty($search_sec_ins_name)) {
                    $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                }
                if (!empty($search_sec_pol_id)) {
                    $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                }
                if (!empty($search_ter_ins_name)) {
                    $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                }
                if (!empty($search_ter_pol_id)) {
                    $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                }
                if (!empty($search_total_ar)) {
                    $claim_data->where('total_ar', 'LIKE', '%' . $search_total_ar . '%');
                }
                if (!empty($search_total_charge)) {
                    $claim_data->where('total_charge', 'LIKE', '%' . $search_total_charge . '%');
                }
            }
        } elseif ($table_name == 'Reassigned_claims') {

            $Claim_history = Claim_history::where('assigned_to', $user_id)->orderBy('id', 'desc')->groupBy('claim_id')->get();

            foreach ($Claim_history as $key => $active) {
                $query = DB::table('claim_histories')
                    ->select(DB::raw("COUNT(claim_id) count, claim_id, id"))
                    ->where('claim_id', $active['claim_id'])
                    ->where('assigned_to', $user_id)
                    ->havingRaw("COUNT(claim_id) != 1")
                    ->get()->toArray();
                $count[$key] = (isset($query[0])) ? $query[0]->claim_id : 0;
            }

            foreach ($count as $values) {

                $claim_data[] = Import_field::where('claim_no',  $values)->where('assigned_to', $user_id)->where('claim_status', 'Assigned')->get()->toArray();
            }

            $claim_array = array_filter(array_map('array_filter', $claim_data));

            $multi_claim_data = $claim_array;

            $merge_claim_data = array_reduce($multi_claim_data, 'array_merge', array());

            $reassign = array_column($merge_claim_data, 'claim_no');


            if (empty($search)) {
                $claim_data = Import_field::whereIN('claim_no', $reassign);
            } else {

                $claim_data = Import_field::whereIN('claim_no', $reassign);

                if (!empty($search_claim_no)) {
                    $claim_data->where('claim_no', 'LIKE', '%' . $search_claim_no . '%');
                }
                if (!empty($search_acc_no)) {
                    $claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');
                }
                if (!empty($search_claim_note)) {
                    $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                }
                if (!empty($search_dos)) {

                    $search_date = explode('-', $search_dos);
                    $dos_sart_date = date('Y-m-d', strtotime($search_date[0]));
                    $dos_end_date = date('Y-m-d', strtotime($search_date[1]));

                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                }
                if (!empty($search_patient_name)) {
                    $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                }
                if (!empty($search_prim_ins_name)) {
                    $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                }
                if (!empty($search_prim_pol_id)) {
                    $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                }
                if (!empty($search_sec_ins_name)) {
                    $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                }
                if (!empty($search_sec_pol_id)) {
                    $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                }
                if (!empty($search_ter_ins_name)) {
                    $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                }
                if (!empty($search_ter_pol_id)) {
                    $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                }
                if (!empty($search_total_ar)) {
                    $claim_data->where('total_ar', 'LIKE', '%' . $search_total_ar . '%');
                }
                if (!empty($search_total_charge)) {
                    $claim_data->where('total_charge', 'LIKE', '%' . $search_total_charge . '%');
                }
            }
        } elseif ($table_name == 'Closed_claims') {
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


            if (empty($search)) {
                $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1);
            } else {

                $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1);

                if (!empty($search_claim_no)) {
                    $claim_data->where('claim_no', 'LIKE', '%' . $search_claim_no . '%');
                }
                if (!empty($search_acc_no)) {
                    $claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');
                }
                if (!empty($search_claim_note)) {
                    $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                }
                if (!empty($search_dos)) {

                    $search_date = explode('-', $search_dos);
                    $dos_sart_date = date('Y-m-d', strtotime($search_date[0]));
                    $dos_end_date = date('Y-m-d', strtotime($search_date[1]));

                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                }
                if (!empty($search_patient_name)) {
                    $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                }
                if (!empty($search_prim_ins_name)) {
                    $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                }
                if (!empty($search_prim_pol_id)) {
                    $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                }
                if (!empty($search_sec_ins_name)) {
                    $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                }
                if (!empty($search_sec_pol_id)) {
                    $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                }
                if (!empty($search_ter_ins_name)) {
                    $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                }
                if (!empty($search_ter_pol_id)) {
                    $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                }
                if (!empty($search_total_ar)) {
                    $claim_data->where('total_ar', 'LIKE', '%' . $search_total_ar . '%');
                }
                if (!empty($search_total_charge)) {
                    $claim_data->where('total_charge', 'LIKE', '%' . $search_total_charge . '%');
                }
            }
        }

        $claim_data->leftjoin(DB::raw("(SELECT
			process_notes.claim_id,process_notes.content as process_notes
          FROM process_notes
          WHERE process_notes.deleted_at IS NULL
          AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
          GROUP BY process_notes.claim_id
          ) as process_notes"), function ($join) {
            $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
        });

        $claim_data->leftjoin(DB::raw("(SELECT
			qc_notes.claim_id,qc_notes.content as qc_notes
          FROM qc_notes
          WHERE qc_notes.deleted_at IS NULL
          AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
          GROUP BY qc_notes.claim_id
          ) as qc_notes"), function ($join) {
            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
        });

        $claim_data->leftjoin(DB::raw("(SELECT
			claim_notes.claim_id,claim_notes.content as claims_notes
          FROM claim_notes
          WHERE claim_notes.deleted_at IS NULL
          AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
          GROUP BY claim_notes.claim_id
          ) as claim_notes"), function ($join) {
            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
        });

        $claim_data = $claim_data->get()->toArray();

        foreach ($claim_data as $key => $value) {

            $dob = $claim_data[$key]['created_at'];
            // $claim_age = Carbon::parse($dob)->age;

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

            $dos = strtotime($claim_data[$key]['dos']);

            if (!empty($dos) && $dos != 0000 - 00 - 00 && $dos != 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', $dos);
            }

            if ($dos == 0000 - 00 - 00) {
                $claim_data[$key]['dos'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $dob = strtotime($claim_data[$key]['dob']);

            if (!empty($dob) && $dob != 0000 - 00 - 00 && $dob != 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', $dob);
            }

            if ($dob == 0000 - 00 - 00) {
                $claim_data[$key]['dob'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dob == 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $admit_date = strtotime($claim_data[$key]['admit_date']);

            if (!empty($admit_date) && $admit_date != 0000 - 00 - 00 && $admit_date != 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', $admit_date);
            }

            if ($admit_date == 0000 - 00 - 00) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($admit_date == 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $discharge_date = strtotime($claim_data[$key]['discharge_date']);

            if (!empty($discharge_date) && $discharge_date != 0000 - 00 - 00 && $discharge_date != 1970 - 01 - 01) {

                $claim_data[$key]['discharge_date'] = date('m/d/Y', $discharge_date);
            }

            if ($discharge_date == 0000 - 00 - 00) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($discharge_date == 1970 - 01 - 01) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 01 - 01 - 1970);
            }
        }

        return response()->json([
            'data'  => $claim_data,
            'table' => $excel_name
        ]);
    }

    public function fetch_all_claims_export_data(LoginRequest $request)
    {
        try {
            $user_id = $request->get('user_id');
            $table_name = $request->get('table_name');
            $search = $request->get('search');
            $searchValue = $request->get('searchClaims');

            $excel_Name = 'All Claims-' . $table_name;

            // if($searchValue != null ){
            //   $search_acc_no = $searchValue['acc_no'];
            //   $search_claim_no = $searchValue['claim_no'];
            //   $search_claim_note = $searchValue['claim_note'];
            //   $search_dos = $searchValue['dos'];
            //   $search_patient_name = $searchValue['patient_name'];
            //   $search_prim_ins_name = $searchValue['prim_ins_name'];
            //   $search_prim_pol_id = $searchValue['prim_pol_id'];
            //   $search_sec_ins_name = $searchValue['sec_ins_name'];
            //   $search_sec_pol_id = $searchValue['sec_pol_id'];
            //   $search_ter_ins_name = $searchValue['ter_ins_name'];
            //   $search_ter_pol_id = $searchValue['ter_pol_id'];
            //   $search_total_ar = $searchValue['total_ar'];
            //   $search_total_charge = $searchValue['total_charge'];
            //   $search_responsibility = $searchValue['responsibility'];
            //   $search_rendering_provider = $searchValue['rendering_provider'];
            //   $search_dates = $searchValue['date'];
            // }

            if ($table_name = 'all_claims_list') {
                if ($search == 'null') {
                    $claim_data = Import_field::leftJoin('claim_histories', 'import_fields.claim_no', '=', 'claim_histories.claim_id')
                        ->select('import_fields.*', 'claim_histories.claim_state', DB::raw('max(claim_histories.id) as max_id'), 'claim_histories.created_at as created_ats')
                        ->groupBy('claim_histories.claim_id')
                        ->orderByDesc('max_id')->get()->toArray();
                } else {
                    $claim_data = Import_field::leftJoin('claim_histories', 'import_fields.claim_no', '=', 'claim_histories.claim_id')
                        ->select('import_fields.*', 'claim_histories.claim_state', DB::raw('max(claim_histories.id) as max_id'), 'claim_histories.created_at as created_ats')
                        ->groupBy('claim_histories.claim_id')
                        ->orderByDesc('max_id');

                    if (isset($searchValue['claim_no']) && !empty($searchValue['claim_no'])) {
                        $claim_data->where('import_fields.claim_no', $searchValue['claim_no']);
                    }
                    if (isset($searchValue['acc_no']) && !empty($searchValue['acc_no'])) {
                        $claim_data->where('import_fields.acct_no', $searchValue['acc_no']);
                    }

                    if (isset($searchValue['claim_note']) && !empty($searchValue['claim_note'])) {
                        $claim_data->where('import_fields.claim_note', 'LIKE', '%' . $searchValue['claim_note'] . '%');
                    }

                    if (isset($searchValue['dos']) && $searchValue['dos']['startDate'] != null) {
                        $dos_sart_date = Carbon::createFromFormat('Y-m-d', $searchValue['dos']['startDate'])->startOfDay();
                        $dos_end_date = Carbon::createFromFormat('Y-m-d', $searchValue['dos']['endDate'])->endOfDay();

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    }

                    if (isset($searchValue['patient_name']) && !empty($searchValue['patient_name'])) {
                        $claim_data->where('import_fields.patient_name', 'LIKE', '%' . $searchValue['patient_name'] . '%');
                    }

                    if (isset($searchValue['responsibility']) && !empty($searchValue['responsibility'])) {
                        $claim_data->where('import_fields.responsibility', 'LIKE', '%' . $searchValue['responsibility'] . '%');
                    }

                    if (isset($searchValue['age_filter']) && $searchValue['age_filter'] != null) {
                        $search_age = $searchValue['age_filter'];
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

                    if (isset($searchValue['rendering_provider']) && !empty($searchValue['rendering_provider'])) {
                        $claim_data->where('import_fields.rendering_provider', 'LIKE', '%' . $searchValue['rendering_provider'] . '%');
                    }

                    if (isset($searchValue['payer_name']) && !empty($searchValue['payer_name'])) {
                        $claim_data->where('import_fields.prim_ins_name', 'LIKE', '%' . $searchValue['payer_name'] . '%');
                        $claim_data->orWhere('import_fields.sec_ins_name', 'LIKE', '%' . $searchValue['payer_name'] . '%');
                        $claim_data->orWhere('import_fields.ter_ins_name', 'LIKE', '%' . $searchValue['payer_name'] . '%');
                    }

                    if (isset($searchValue['date']) && $searchValue['date']['startDate'] != null) {
                        $search_dates = $searchValue['date'];
                        $created_start_date = Carbon::createFromFormat('Y-m-d', $search_dates['startDate'])->startOfDay();
                        $created_end_date = Carbon::createFromFormat('Y-m-d', $search_dates['endDate'])->endOfDay();

                        $claim_data->where(DB::raw('DATE(import_fields.created_at)'), '>=', $created_start_date)->where(DB::raw('DATE(import_fields.created_at)'), '<=', $created_end_date);
                    }

                    if (isset($searchValue['bill_submit_date']) && $searchValue['bill_submit_date']['startDate'] != null) {
                        $search_submit_date = $searchValue['bill_submit_date'];
                        $bill_start_date = Carbon::createFromFormat('Y-m-d', $search_submit_date['startDate'])->startOfDay();
                        $bill_end_date = Carbon::createFromFormat('Y-m-d', $search_submit_date['endDate'])->endOfDay();

                        $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                    }

                    if (isset($searchValue['denial_code']) && !empty($searchValue['denial_code'])) {
                        $claim_data->where('import_fields.denial_code', $searchValue['denial_code']);
                    }

                    if (isset($searchValue['prim_pol_id']) && !empty($searchValue['prim_pol_id'])) {
                        $claim_data->where('import_fields.prim_pol_id', 'LIKE', '%' . $searchValue['prim_pol_id'] . '%');
                    }

                    if (isset($searchValue['sec_pol_id']) && !empty($searchValue['sec_pol_id'])) {
                        $claim_data->where('import_fields.sec_pol_id', 'LIKE', '%' . $searchValue['sec_pol_id'] . '%');
                    }

                    if (isset($searchValue['ter_pol_id']) && !empty($searchValue['ter_pol_id'])) {
                        $claim_data->where('import_fields.ter_pol_id', 'LIKE', '%' . $searchValue['ter_pol_id'] . '%');
                    }

                    if (isset($searchValue['total_ar']) && !empty($searchValue['total_ar'])) {
                        $OriginalString = trim($searchValue['total_ar']);
                        $tot_ar = explode("-", $OriginalString);
                        $min_tot_ar = $tot_ar[0] - 1.00;
                        $max_tot_ar = $tot_ar[1];

                        $claim_data->whereBetween('import_fields.total_ar', [$min_tot_ar, $max_tot_ar]);
                    }

                    if (isset($searchValue['total_charge']) && !empty($searchValue['total_charge'])) {
                        $claim_data->where('import_fields.total_charge', $searchValue['total_charge']);
                    }
                    $claim_data = $claim_data->get()->toArray();
                }
            }


            return response()->json([
                'data'  => $claim_data,
                'table' => $excel_Name
            ]);
        } catch (Exception $e) {
            Log::debug('all claims export data error :' . $e->getMessage());
        }
    }

    public function fetch_audit_claims_export_data(LoginRequest $request)
    {

        $user_id = $request->get('user_id');
        $table_name = $request->get('table_name');
        $search = $request->get('search');
        $searchValue = $request->get('searchClaims');

        $excel_name = 'Audit- ' . $table_name;

        if ($searchValue != null) {
            $search_acc_no = $searchValue['acc_no'];
            $search_claim_no = $searchValue['claim_no'];
            $search_claim_note = $searchValue['claim_note'];
            $search_dos = $searchValue['dos'];
            $search_insurance = $searchValue['insurance'];
            $search_patient_name = $searchValue['patient_name'];
            $search_prim_ins_name = $searchValue['prim_ins_name'];
            $search_prim_pol_id = $searchValue['prim_pol_id'];
            $search_sec_ins_name = $searchValue['sec_ins_name'];
            $search_sec_pol_id = $searchValue['sec_pol_id'];
            $search_ter_ins_name = $searchValue['ter_ins_name'];
            $search_ter_pol_id = $searchValue['ter_pol_id'];
            $search_total_ar = $searchValue['total_ar'];
            $search_total_charge = $searchValue['total_charge'];
        }

        if ($table_name == 'Audit_que_claims') {

            $audit = [];

            $claimInfo = Claim_history::orderBy('id', 'desc')->get()->unique('claim_id')->toArray();

            foreach ($claimInfo as $list) {
                if ($list['claim_state'] == 4)
                    array_push($audit, $list['claim_id']);
            }

            if (empty($search)) {
                $claim_data = Import_field::whereIN('claim_no', $audit)->orderBy('created_at', 'desc');
            } else {

                $claim_data = Import_field::whereIN('claim_no', $audit)->orderBy('created_at', 'desc');

                if (!empty($search_claim_no)) {
                    $claim_data->where('claim_no', 'LIKE', '%' . $search_claim_no . '%');
                }
                if (!empty($search_acc_no)) {
                    $claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');
                }
                if (!empty($search_claim_note)) {
                    $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                }
                if (!empty($search_dos)) {

                    $search_date = explode('-', $search_dos);
                    $dos_sart_date = date('Y-m-d', strtotime($search_date[0]));
                    $dos_end_date = date('Y-m-d', strtotime($search_date[1]));

                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                }
                if (!empty($search_patient_name)) {
                    $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                }
                if (!empty($search_prim_ins_name)) {
                    $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                }
                if (!empty($search_prim_pol_id)) {
                    $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                }
                if (!empty($search_sec_ins_name)) {
                    $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                }
                if (!empty($search_sec_pol_id)) {
                    $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                }
                if (!empty($search_ter_ins_name)) {
                    $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                }
                if (!empty($search_ter_pol_id)) {
                    $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                }
                if (!empty($search_total_ar)) {
                    $claim_data->where('total_ar', 'LIKE', '%' . $search_total_ar . '%');
                }
                if (!empty($search_total_charge)) {
                    $claim_data->where('total_charge', 'LIKE', '%' . $search_total_charge . '%');
                }
            }
        } elseif ($table_name == 'Assigned_claims') {

            $assign = [];

            $claimInfo = Claim_history::orderBy('id', 'desc')->get()->unique('claim_id')->toArray();

            foreach ($claimInfo as $claimList) {
                if (isset($claimList) && $claimList['claim_state'] == 5 && $claimList['assigned_to'] == $user_id)
                    array_push($assign, $claimList['claim_id']);
            }


            if (empty($search)) {
                $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1);
            } else {

                $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1);

                if (!empty($search_claim_no)) {
                    $claim_data->where('claim_no', 'LIKE', '%' . $search_claim_no . '%');
                }
                if (!empty($search_acc_no)) {
                    $claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');
                }
                if (!empty($search_claim_note)) {
                    $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                }
                if (!empty($search_dos)) {

                    $search_date = explode('-', $search_dos);
                    $dos_sart_date = date('Y-m-d', strtotime($search_date[0]));
                    $dos_end_date = date('Y-m-d', strtotime($search_date[1]));

                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                }
                if (!empty($search_patient_name)) {
                    $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                }
                if (!empty($search_prim_ins_name)) {
                    $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                }
                if (!empty($search_prim_pol_id)) {
                    $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                }
                if (!empty($search_sec_ins_name)) {
                    $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                }
                if (!empty($search_sec_pol_id)) {
                    $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                }
                if (!empty($search_ter_ins_name)) {
                    $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                }
                if (!empty($search_ter_pol_id)) {
                    $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                }
                if (!empty($search_total_ar)) {
                    $claim_data->where('total_ar', 'LIKE', '%' . $search_total_ar . '%');
                }
                if (!empty($search_total_charge)) {
                    $claim_data->where('total_charge', 'LIKE', '%' . $search_total_charge . '%');
                }
            }
        } elseif ($table_name == 'Closed_claims') {

            $closed = [];

            $claimInfo = Claim_history::orderBy('id', 'desc')->get()->unique('claim_id')->toArray();

            foreach ($claimInfo as $claimList) {

                if (isset($claimList) && $claimList['claim_state'] == 9 &&  $claimList['assigned_by'] == $user_id)
                    array_push($closed, $claimList['claim_id']);
            }


            if (empty($search)) {
                $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1);
            } else {

                $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1);

                if (!empty($search_claim_no)) {
                    $claim_data->where('claim_no', 'LIKE', '%' . $search_claim_no . '%');
                }
                if (!empty($search_acc_no)) {
                    $claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');
                }
                if (!empty($search_claim_note)) {
                    $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                }
                if (!empty($search_dos)) {

                    $search_date = explode('-', $search_dos);
                    $dos_sart_date = date('Y-m-d', strtotime($search_date[0]));
                    $dos_end_date = date('Y-m-d', strtotime($search_date[1]));

                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                }
                if (!empty($search_patient_name)) {
                    $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                }
                if (!empty($search_prim_ins_name)) {
                    $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                }
                if (!empty($search_prim_pol_id)) {
                    $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                }
                if (!empty($search_sec_ins_name)) {
                    $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                }
                if (!empty($search_sec_pol_id)) {
                    $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                }
                if (!empty($search_ter_ins_name)) {
                    $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                }
                if (!empty($search_ter_pol_id)) {
                    $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                }
                if (!empty($search_total_ar)) {
                    $claim_data->where('total_ar', 'LIKE', '%' . $search_total_ar . '%');
                }
                if (!empty($search_total_charge)) {
                    $claim_data->where('total_charge', 'LIKE', '%' . $search_total_charge . '%');
                }
            }
        }

        $claim_data->leftjoin(DB::raw("(SELECT
	        claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
	      AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
        });

        $claim_data = $claim_data->get()->toArray();

        foreach ($claim_data as $key => $value) {

            $dob = $claim_data[$key]['created_at'];
            // $claim_age = Carbon::parse($dob)->age;

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

            $dob = $claim_data[$key]['created_at'];
            // $claim_age = Carbon::parse($dob)->age;

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


            $dos = strtotime($claim_data[$key]['dos']);

            if (!empty($dos) && $dos != 0000 - 00 - 00 && $dos != 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', $dos);
            }

            if ($dos == 0000 - 00 - 00) {
                $claim_data[$key]['dos'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $dob = strtotime($claim_data[$key]['dob']);

            if (!empty($dob) && $dob != 0000 - 00 - 00 && $dob != 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', $dob);
            }

            if ($dob == 0000 - 00 - 00) {
                $claim_data[$key]['dob'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dob == 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $admit_date = strtotime($claim_data[$key]['admit_date']);

            if (!empty($admit_date) && $admit_date != 0000 - 00 - 00 && $admit_date != 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', $admit_date);
            }

            if ($admit_date == 0000 - 00 - 00) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($admit_date == 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $discharge_date = strtotime($claim_data[$key]['discharge_date']);

            if (!empty($discharge_date) && $discharge_date != 0000 - 00 - 00 && $discharge_date != 1970 - 01 - 01) {

                $claim_data[$key]['discharge_date'] = date('m/d/Y', $discharge_date);
            }

            if ($discharge_date == 0000 - 00 - 00) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($discharge_date == 1970 - 01 - 01) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $total_ar = $claim_data[$key]['total_ar'];

            $claim_data[$key]['total_ar'] = number_format((float)$total_ar, 2, '.', '');

            $total_charges = $claim_data[$key]['total_charges'];

            $claim_data[$key]['total_charges'] = number_format((float)$total_charges, 2, '.', '');

            $pat_ar = $claim_data[$key]['pat_ar'];

            $claim_data[$key]['pat_ar'] = number_format((float)$pat_ar, 2, '.', '');

            $ins_ar = $claim_data[$key]['ins_ar'];

            $claim_data[$key]['ins_ar'] = number_format((float)$ins_ar, 2, '.', '');
        }


        return response()->json([
            'data'  => $claim_data,
            'table' => $excel_name
        ]);
    }

    public function fetch_billing_claims_export_data(LoginRequest $request)
    {

        $user_id = $request->get('user_id');
        $table_name = $request->get('table_name');
        $search = $request->get('search');
        $searchValue = $request->get('searchClaims');


        if ($searchValue != null) {
            $search_acc_no = $searchValue['acc_no'];
            $search_claim_no = $searchValue['claim_no'];
            $search_claim_note = $searchValue['claim_note'];
            $search_dos = $searchValue['dos'];
            $search_insurance = $searchValue['insurance'];
            $search_patient_name = $searchValue['patient_name'];
            $search_prim_ins_name = $searchValue['prim_ins_name'];
            $search_prim_pol_id = $searchValue['prim_pol_id'];
            $search_sec_ins_name = $searchValue['sec_ins_name'];
            $search_sec_pol_id = $searchValue['sec_pol_id'];
            $search_ter_ins_name = $searchValue['ter_ins_name'];
            $search_ter_pol_id = $searchValue['ter_pol_id'];
            $search_total_ar = $searchValue['total_ar'];
            $search_total_charge = $searchValue['total_charge'];
        }

        $user_role = User::where('id', $user_id)->pluck('role_id');

        if ($user_role[0] == 5 || $user_role[0] == 3 || $user_role[0] == 2) {

            $users = User::where('role_id', '7')->orWhere('role_id', '3')->pluck('id');

            $claims = Claim_history::where('claim_state', '8')->distinct('claim_id')->pluck('claim_id');
            //dd($claims);
            //$claims=Action::whereIN('assigned_to', $users)->distinct('claim_id')-> offset($skip) ->limit($end)->pluck('claim_id');
            $claim_count = Action::whereIN('assigned_to', $users)->distinct('claim_id')->pluck('claim_id');
            $claim_count = sizeof($claim_count);
            // $claim_data= Import_field::whereIN('claim_no',$claims)->get();


            if (empty($search)) {
                $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->distinct('claim_no');
            } else {

                $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->distinct('claim_no');

                if (!empty($search_claim_no)) {
                    $claim_data->where('claim_no', 'LIKE', '%' . $search_claim_no . '%');
                }
                if (!empty($search_acc_no)) {
                    $claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');
                }
                if (!empty($search_claim_note)) {
                    $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                }
                if (!empty($search_dos)) {

                    $search_date = explode('-', $search_dos);
                    $dos_sart_date = date('Y-m-d', strtotime($search_date[0]));
                    $dos_end_date = date('Y-m-d', strtotime($search_date[1]));

                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                }
                if (!empty($search_patient_name)) {
                    $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                }
                if (!empty($search_prim_ins_name)) {
                    $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                }
                if (!empty($search_prim_pol_id)) {
                    $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                }
                if (!empty($search_sec_ins_name)) {
                    $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                }
                if (!empty($search_sec_pol_id)) {
                    $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                }
                if (!empty($search_ter_ins_name)) {
                    $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                }
                if (!empty($search_ter_pol_id)) {
                    $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                }
                if (!empty($search_total_ar)) {
                    $claim_data->where('total_ar', 'LIKE', '%' . $search_total_ar . '%');
                }
                if (!empty($search_total_charge)) {
                    $claim_data->where('total_charge', 'LIKE', '%' . $search_total_charge . '%');
                }
            }
        }

        $claim_data->leftjoin(DB::raw("(SELECT
		          claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
		        AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
        });

        $claim_data = $claim_data->get()->toArray();

        foreach ($claim_data as $key => $value) {

            $dob = $claim_data[$key]['created_at'];
            // $claim_age = Carbon::parse($dob)->age;

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

            $dos = strtotime($claim_data[$key]['dos']);

            if (!empty($dos) && $dos != 0000 - 00 - 00 && $dos != 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', $dos);
            }

            if ($dos == 0000 - 00 - 00) {
                $claim_data[$key]['dos'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $dob = strtotime($claim_data[$key]['dob']);

            if (!empty($dob) && $dob != 0000 - 00 - 00 && $dob != 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', $dob);
            }

            if ($dob == 0000 - 00 - 00) {
                $claim_data[$key]['dob'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dob == 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $admit_date = strtotime($claim_data[$key]['admit_date']);

            if (!empty($admit_date) && $admit_date != 0000 - 00 - 00 && $admit_date != 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', $admit_date);
            }

            if ($admit_date == 0000 - 00 - 00) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($admit_date == 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $discharge_date = strtotime($claim_data[$key]['discharge_date']);

            if (!empty($discharge_date) && $discharge_date != 0000 - 00 - 00 && $discharge_date != 1970 - 01 - 01) {

                $claim_data[$key]['discharge_date'] = date('m/d/Y', $discharge_date);
            }

            if ($discharge_date == 0000 - 00 - 00) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($discharge_date == 1970 - 01 - 01) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $total_ar = $claim_data[$key]['total_ar'];

            $claim_data[$key]['total_ar'] = number_format((float)$total_ar, 2, '.', '');

            $total_charges = $claim_data[$key]['total_charges'];

            $claim_data[$key]['total_charges'] = number_format((float)$total_charges, 2, '.', '');

            $pat_ar = $claim_data[$key]['pat_ar'];

            $claim_data[$key]['pat_ar'] = number_format((float)$pat_ar, 2, '.', '');

            $ins_ar = $claim_data[$key]['ins_ar'];

            $claim_data[$key]['ins_ar'] = number_format((float)$ins_ar, 2, '.', '');
        }

        return response()->json([
            'data'  => $claim_data,
            'table' => $table_name
        ]);
    }

    public function fetch_client_claims_export_data(LoginRequest $request)
    {
        $user_id = $request->get('user_id');
        $table_name = $request->get('table_name');
        $search = $request->get('search');
        $searchValue = $request->get('searchClaims');

        if ($searchValue != null) {
            $search_acc_no = $searchValue['acc_no'];
            $search_claim_no = $searchValue['claim_no'];
            $search_claim_note = $searchValue['claim_note'];
            $search_dos = $searchValue['dos'];
            $search_insurance = $searchValue['insurance'];
            $search_patient_name = $searchValue['patient_name'];
            $search_prim_ins_name = $searchValue['prim_ins_name'];
            $search_prim_pol_id = $searchValue['prim_pol_id'];
            $search_sec_ins_name = $searchValue['sec_ins_name'];
            $search_sec_pol_id = $searchValue['sec_pol_id'];
            $search_ter_ins_name = $searchValue['ter_ins_name'];
            $search_ter_pol_id = $searchValue['ter_pol_id'];
            $search_total_ar = $searchValue['total_ar'];
            $search_total_charge = $searchValue['total_charge'];
        }

        $user_role = User::where('id', $user_id)->first();

        if ($user_role['role_id'] == 5 || $user_role['role_id'] == 3 || $user_role['role_id'] == 2) {
            $users = User::where('role_id', '6')->orWhere('role_id', '3')->pluck('id');

            $claims = Claim_history::where('claim_state', '7')->distinct('claim_id')->pluck('claim_id');



            if (empty($search)) {
                $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->distinct('claim_no');
            } else {

                $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->distinct('claim_no');

                if (!empty($search_claim_no)) {
                    $claim_data->where('claim_no', 'LIKE', '%' . $search_claim_no . '%');
                }
                if (!empty($search_acc_no)) {
                    $claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');
                }
                if (!empty($search_claim_note)) {
                    $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                }
                if (!empty($search_dos)) {

                    $search_date = explode('-', $search_dos);
                    $dos_sart_date = date('Y-m-d', strtotime($search_date[0]));
                    $dos_end_date = date('Y-m-d', strtotime($search_date[1]));

                    $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                }
                if (!empty($search_patient_name)) {
                    $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                }
                if (!empty($search_prim_ins_name)) {
                    $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                }
                if (!empty($search_prim_pol_id)) {
                    $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                }
                if (!empty($search_sec_ins_name)) {
                    $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                }
                if (!empty($search_sec_pol_id)) {
                    $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                }
                if (!empty($search_ter_ins_name)) {
                    $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                }
                if (!empty($search_ter_pol_id)) {
                    $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                }
                if (!empty($search_total_ar)) {
                    $claim_data->where('total_ar', 'LIKE', '%' . $search_total_ar . '%');
                }
                if (!empty($search_total_charge)) {
                    $claim_data->where('total_charge', 'LIKE', '%' . $search_total_charge . '%');
                }
            }
        }

        $claim_data->leftjoin(DB::raw("(SELECT
		          claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
		        AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
        });

        $claim_data = $claim_data->get()->toArray();

        foreach ($claim_data as $key => $value) {

            $dob = $claim_data[$key]['created_at'];
            // $claim_age = Carbon::parse($dob)->age;

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


            $dos = strtotime($claim_data[$key]['dos']);

            if (!empty($dos) && $dos != 0000 - 00 - 00 && $dos != 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', $dos);
            }

            if ($dos == 0000 - 00 - 00) {
                $claim_data[$key]['dos'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $dob = strtotime($claim_data[$key]['dob']);

            if (!empty($dob) && $dob != 0000 - 00 - 00 && $dob != 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', $dob);
            }

            if ($dob == 0000 - 00 - 00) {
                $claim_data[$key]['dob'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dob == 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $admit_date = strtotime($claim_data[$key]['admit_date']);

            if (!empty($admit_date) && $admit_date != 0000 - 00 - 00 && $admit_date != 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', $admit_date);
            }

            if ($admit_date == 0000 - 00 - 00) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($admit_date == 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $discharge_date = strtotime($claim_data[$key]['discharge_date']);

            if (!empty($discharge_date) && $discharge_date != 0000 - 00 - 00 && $discharge_date != 1970 - 01 - 01) {

                $claim_data[$key]['discharge_date'] = date('m/d/Y', $discharge_date);
            }

            if ($discharge_date == 0000 - 00 - 00) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($discharge_date == 1970 - 01 - 01) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $total_ar = $claim_data[$key]['total_ar'];

            $claim_data[$key]['total_ar'] = number_format((float)$total_ar, 2, '.', '');

            $total_charges = $claim_data[$key]['total_charges'];

            $claim_data[$key]['total_charges'] = number_format((float)$total_charges, 2, '.', '');

            $pat_ar = $claim_data[$key]['pat_ar'];

            $claim_data[$key]['pat_ar'] = number_format((float)$pat_ar, 2, '.', '');

            $ins_ar = $claim_data[$key]['ins_ar'];

            $claim_data[$key]['ins_ar'] = number_format((float)$ins_ar, 2, '.', '');
        }

        return response()->json([
            'data'  => $claim_data,
            'table' => $table_name
        ]);
    }

    public function fetch_work_order_export_data(LoginRequest $request)
    {

        $table_name = $request->get('table_name');
        $search = $request->get('search');


        $searchValue = $request->get('searchClaims');

        if ($searchValue != null) {
            $search_created_at = $searchValue['created_at'];
            $search_due_date = $searchValue['due_date'];
            $search_priority = $searchValue['priority'];
            $search_work_order_name = $searchValue['work_order_name'];
        }

        if ($table_name == 'Work_order_claims') {

            $wo_type = 1;

            if (empty($search)) {
                $claim_data = Workorder_field::where('work_order_type', $wo_type);
            } else {

                $claim_data = Workorder_field::where('work_order_type', $wo_type);

                if (!empty($search_created_at)) {

                    $search_date = explode('-', $search_created_at);
                    $created_sart_date = date('Y-m-d', strtotime($search_date[0]));
                    $created_end_date = date('Y-m-d', strtotime($search_date[1]));

                    $claim_data->where(DB::raw('DATE(workorder_fields.created_at)'), '>=', $created_sart_date)->where(DB::raw('DATE(workorder_fields.created_at)'), '<=', $created_end_date);
                }
                if (!empty($search_due_date)) {

                    $search_date = explode('-', $search_due_date);
                    $due_sart_date = date('Y-m-d', strtotime($search_date[0]));
                    $due_end_date = date('Y-m-d', strtotime($search_date[1]));

                    $claim_data->where(DB::raw('DATE(workorder_fields.due_date)'), '>=', $due_sart_date)->where(DB::raw('DATE(workorder_fields.due_date)'), '<=', $due_end_date);
                }
                if (!empty($search_priority)) {
                    $claim_data->where('priority', 'LIKE', '%' . $search_priority . '%');
                }
                if (!empty($search_work_order_name)) {
                    $claim_data->where('work_order_name', 'LIKE', '%' . $search_work_order_name . '%');
                }
            }
        } elseif ($table_name == 'Audit_work_order_claims') {
            $wo_type = 2;

            if (empty($search)) {

                $claim_data = Workorder_field::where('work_order_type', $wo_type);
            } else {

                $claim_data = Workorder_field::where('work_order_type', $wo_type);

                if (!empty($search_created_at)) {

                    $search_date = explode('-', $search_created_at);
                    $created_sart_date = date('Y-m-d', strtotime($search_date[0]));
                    $created_end_date = date('Y-m-d', strtotime($search_date[1]));

                    $claim_data->where(DB::raw('DATE(workorder_fields.created_at)'), '>=', $created_sart_date)->where(DB::raw('DATE(workorder_fields.created_at)'), '<=', $created_end_date);
                }
                if (!empty($search_due_date)) {

                    $search_date = explode('-', $search_due_date);
                    $due_sart_date = date('Y-m-d', strtotime($search_date[0]));
                    $due_end_date = date('Y-m-d', strtotime($search_date[1]));

                    $claim_data->where(DB::raw('DATE(workorder_fields.due_date)'), '>=', $due_sart_date)->where(DB::raw('DATE(workorder_fields.due_date)'), '<=', $due_end_date);
                }
                if (!empty($search_priority)) {
                    $claim_data->where('priority', 'LIKE', '%' . $search_priority . '%');
                }
                if (!empty($search_work_order_name)) {
                    $claim_data->where('work_order_name', 'LIKE', '%' . $search_work_order_name . '%');
                }
            }
        }

        $claim_data = $claim_data->get()->toArray();

        $id = 0;
        foreach ($claim_data as $key => $claim) {

            $created_at = strtotime($claim_data[$key]['created_at']);

            if (!empty($created_at)) {

                $claim_data[$key]['created_at'] = date('m/d/Y', $created_at);
            }

            $due_date = strtotime($claim_data[$key]['due_date']);

            if (!empty($due_date)) {

                $claim_data[$key]['due_date'] = date('m/d/Y', $due_date);
            }



            $claim_details = [];
            $total_ar_due = 0.00;
            $billed_amt = 0.00;
            $assigned_claims = Action::where('action_id', $claim['id'])->count();
            $assigned_claim_details = Action::where('action_id', $claim['id'])->get();

            if ($assigned_claims != 0) {
                foreach ($assigned_claim_details as $claims) {
                    $claim_details = Import_field::where('claim_no', $claims['claim_id'])->get();

                    if (sizeof($claim_details) != 0) {
                        $total_ar_due += floatval($claim_details[0]['total_ar']);
                        $billed_amt += floatval($claim_details[0]['total_charges']);
                    }
                }
            }

            $created = User::where('id', $claim['created_by'])->pluck('firstname');
            if (sizeOf($created) == 0) {
                $created = "NA";
            } else {
                $created = $created[0];
            }

            $claim_data[$id]['assigned_nos'] = $assigned_claims;
            $claim_data[$id]['created'] = $created;
            $claim_data[$id]['ar_due'] = number_format((float)$total_ar_due, 2, '.', '');
            $claim_data[$id]['billed'] = number_format((float)$billed_amt, 2, '.', '');
            $id++;
        }

        return response()->json([
            'data'  => $claim_data,
            'table' => $table_name
        ]);
    }

    public function fetch_create_claims_export_data_pdf(LoginRequest $request)
    {

        $user_id = $request->get('user_id');
        $table_name = $request->get('table_name');

        $closed = [];

        if ($table_name == 'create_work_order') {

            $claim_data = Import_field::whereNull('followup_work_order');
        } elseif ($table_name == 'closed_claim') {

            $claimInfo = Claim_history::orderBy('id', 'desc')->get()->unique('claim_id')->toArray();

            foreach ($claimInfo as $claimList) {

                if (isset($claimList))
                    array_push($closed, $claimList['claim_id']);
            }

            $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1);
        } elseif ($table_name == 'work_orders') {

            $wo_type = 1;

            $claim_data = Workorder_field::where('work_order_type', $wo_type)->get()->toArray();
        }



        $claim_data->leftjoin(DB::raw("(SELECT
      process_notes.claim_id,process_notes.content as process_notes
          FROM process_notes
          WHERE process_notes.deleted_at IS NULL
          AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
          GROUP BY process_notes.claim_id
          ) as process_notes"), function ($join) {
            $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
        });

        $claim_data->leftjoin(DB::raw("(SELECT
      qc_notes.claim_id,qc_notes.content as qc_notes
          FROM qc_notes
          WHERE qc_notes.deleted_at IS NULL
          AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
          GROUP BY qc_notes.claim_id
          ) as qc_notes"), function ($join) {
            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
        });

        $claim_data->leftjoin(DB::raw("(SELECT
      claim_notes.claim_id,claim_notes.content as claims_notes
          FROM claim_notes
          WHERE claim_notes.deleted_at IS NULL
          AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
          GROUP BY claim_notes.claim_id
          ) as claim_notes"), function ($join) {
            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
        });

        $claim_data = $claim_data->get()->toArray();

        foreach ($claim_data as $key => $value) {

            $dob = $claim_data[$key]['created_at'];
            // $claim_age = Carbon::parse($dob)->age;

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

            $dos = strtotime($claim_data[$key]['dos']);

            if (!empty($dos) && $dos != 0000 - 00 - 00 && $dos != 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', $dos);
            }

            if ($dos == 0000 - 00 - 00) {
                $claim_data[$key]['dos'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $dob = strtotime($claim_data[$key]['dob']);

            if (!empty($dob) && $dob != 0000 - 00 - 00 && $dob != 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', $dob);
            }

            if ($dob == 0000 - 00 - 00) {
                $claim_data[$key]['dob'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dob == 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $admit_date = strtotime($claim_data[$key]['admit_date']);

            if (!empty($admit_date) && $admit_date != 0000 - 00 - 00 && $admit_date != 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', $admit_date);
            }

            if ($admit_date == 0000 - 00 - 00) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($admit_date == 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $discharge_date = strtotime($claim_data[$key]['discharge_date']);

            if (!empty($discharge_date) && $discharge_date != 0000 - 00 - 00 && $discharge_date != 1970 - 01 - 01) {

                $claim_data[$key]['discharge_date'] = date('m/d/Y', $discharge_date);
            }

            if ($discharge_date == 0000 - 00 - 00) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($discharge_date == 1970 - 01 - 01) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $total_ar = $claim_data[$key]['total_ar'];

            $claim_data[$key]['total_ar'] = number_format((float)$total_ar, 2, '.', '');

            $total_charges = $claim_data[$key]['total_charges'];

            $claim_data[$key]['total_charges'] = number_format((float)$total_charges, 2, '.', '');

            $pat_ar = $claim_data[$key]['pat_ar'];

            $claim_data[$key]['pat_ar'] = number_format((float)$pat_ar, 2, '.', '');

            $ins_ar = $claim_data[$key]['ins_ar'];

            $claim_data[$key]['ins_ar'] = number_format((float)$ins_ar, 2, '.', '');
        }

        return response()->json([
            'data'  => $claim_data
        ]);
    }

    public function fetch_followup_claims_export_data_pdf(LoginRequest $request)
    {

        $user_id = $request->get('user_id');
        $table_name = $request->get('table_name');

        $worked = [];
        $pending = [];
        $assign = [];
        $reassign = [];

        if ($table_name == 'assigned_claims') {

            $Claim_history = Claim_history::where('assigned_to', $user_id)->orderBy('id', 'desc')->groupBy('claim_id')->get();

            foreach ($Claim_history as $key => $active) {
                $query = DB::table('claim_histories')
                    ->select(DB::raw("COUNT(claim_id) count, claim_id, id"))
                    ->where('claim_id', $active['claim_id'])
                    ->where('assigned_to', $user_id)
                    ->havingRaw("COUNT(claim_id) = 1")
                    ->get()->toArray();
                $count[$key] = (isset($query[0])) ? $query[0]->claim_id : 0;
            }

            $array = [];

            foreach ($count as $values) {

                $claim_data[] = Import_field::where('claim_no',  $values)->where('assigned_to', $user_id)->where('claim_status', 'Assigned')->get()->toArray();
            }
            $claim_array = array_filter(array_map('array_filter', $claim_data));

            $multi_claim_data = $claim_array;

            $merge_claim_data = array_reduce($multi_claim_data, 'array_merge', array());

            $assign = array_column($merge_claim_data, 'claim_no');

            $claim_data = Import_field::whereIN('claim_no', $assign)->where('assigned_to', $user_id);
        } elseif ($table_name == 'reassigned_claims') {

            $Claim_history = Claim_history::where('assigned_to', $user_id)->orderBy('id', 'desc')->groupBy('claim_id')->get();

            foreach ($Claim_history as $key => $active) {
                $query = DB::table('claim_histories')
                    ->select(DB::raw("COUNT(claim_id) count, claim_id, id"))
                    ->where('claim_id', $active['claim_id'])
                    ->where('assigned_to', $user_id)
                    ->havingRaw("COUNT(claim_id) != 1")
                    ->get()->toArray();
                $count[$key] = (isset($query[0])) ? $query[0]->claim_id : 0;
            }

            foreach ($count as $values) {

                $claim_data[] = Import_field::where('claim_no',  $values)->where('assigned_to', $user_id)->where('claim_status', 'Assigned')->get()->toArray();
            }

            $claim_array = array_filter(array_map('array_filter', $claim_data));

            $multi_claim_data = $claim_array;

            $merge_claim_data = array_reduce($multi_claim_data, 'array_merge', array());

            $reassign = array_column($merge_claim_data, 'claim_no');


            $claim_data = Import_field::whereIN('claim_no', $reassign);
        } elseif ($table_name == 'closed_claim') {
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

            $claim_data = Import_field::whereIN('claim_no', $worked)->where('claim_closing', 1);
        }

        $claim_data->leftjoin(DB::raw("(SELECT
      process_notes.claim_id,process_notes.content as process_notes
          FROM process_notes
          WHERE process_notes.deleted_at IS NULL
          AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
          GROUP BY process_notes.claim_id
          ) as process_notes"), function ($join) {
            $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
        });

        $claim_data->leftjoin(DB::raw("(SELECT
      qc_notes.claim_id,qc_notes.content as qc_notes
          FROM qc_notes
          WHERE qc_notes.deleted_at IS NULL
          AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
          GROUP BY qc_notes.claim_id
          ) as qc_notes"), function ($join) {
            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
        });

        $claim_data->leftjoin(DB::raw("(SELECT
      claim_notes.claim_id,claim_notes.content as claims_notes
          FROM claim_notes
          WHERE claim_notes.deleted_at IS NULL
          AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
          GROUP BY claim_notes.claim_id
          ) as claim_notes"), function ($join) {
            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
        });

        $claim_data = $claim_data->get()->toArray();

        foreach ($claim_data as $key => $value) {

            $dob = $claim_data[$key]['created_at'];
            // $claim_age = Carbon::parse($dob)->age;

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

            $dos = strtotime($claim_data[$key]['dos']);

            if (!empty($dos) && $dos != 0000 - 00 - 00 && $dos != 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', $dos);
            }

            if ($dos == 0000 - 00 - 00) {
                $claim_data[$key]['dos'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $dob = strtotime($claim_data[$key]['dob']);

            if (!empty($dob) && $dob != 0000 - 00 - 00 && $dob != 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', $dob);
            }

            if ($dob == 0000 - 00 - 00) {
                $claim_data[$key]['dob'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dob == 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $admit_date = strtotime($claim_data[$key]['admit_date']);

            if (!empty($admit_date) && $admit_date != 0000 - 00 - 00 && $admit_date != 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', $admit_date);
            }

            if ($admit_date == 0000 - 00 - 00) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($admit_date == 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $discharge_date = strtotime($claim_data[$key]['discharge_date']);

            if (!empty($discharge_date) && $discharge_date != 0000 - 00 - 00 && $discharge_date != 1970 - 01 - 01) {

                $claim_data[$key]['discharge_date'] = date('m/d/Y', $discharge_date);
            }

            if ($discharge_date == 0000 - 00 - 00) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($discharge_date == 1970 - 01 - 01) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $total_ar = $claim_data[$key]['total_ar'];

            $claim_data[$key]['total_ar'] = number_format((float)$total_ar, 2, '.', '');

            $total_charges = $claim_data[$key]['total_charges'];

            $claim_data[$key]['total_charges'] = number_format((float)$total_charges, 2, '.', '');

            $pat_ar = $claim_data[$key]['pat_ar'];

            $claim_data[$key]['pat_ar'] = number_format((float)$pat_ar, 2, '.', '');

            $ins_ar = $claim_data[$key]['ins_ar'];

            $claim_data[$key]['ins_ar'] = number_format((float)$ins_ar, 2, '.', '');
        }

        return response()->json([
            'data'  => $claim_data
        ]);
    }

    public function fetch_audit_claims_export_data_pdf(LoginRequest $request)
    {

        $user_id = $request->get('user_id');
        $table_name = $request->get('table_name');

        if ($table_name == 'audit_claim') {

            $audit = [];

            $claimInfo = Claim_history::orderBy('id', 'desc')->get()->unique('claim_id')->toArray();

            foreach ($claimInfo as $list) {
                if ($list['claim_state'] == 4)
                    array_push($audit, $list['claim_id']);
            }

            $claim_data = Import_field::whereIN('claim_no', $audit)->orderBy('created_at', 'desc');
        } elseif ($table_name == 'assigned_claim') {

            $assign = [];

            $claimInfo = Claim_history::orderBy('id', 'desc')->get()->unique('claim_id')->toArray();

            foreach ($claimInfo as $claimList) {
                if (isset($claimList) && $claimList['claim_state'] == 5 && $claimList['assigned_to'] == $user_id)
                    array_push($assign, $claimList['claim_id']);
            }

            $claim_data = Import_field::whereIN('claim_no', $assign)->where('claim_closing', '!=', 1);
        } elseif ($table_name == 'closed_claim') {

            $closed = [];

            $claimInfo = Claim_history::orderBy('id', 'desc')->get()->unique('claim_id')->toArray();

            foreach ($claimInfo as $claimList) {

                if (isset($claimList) && $claimList['claim_state'] == 9 &&  $claimList['assigned_by'] == $user_id)
                    array_push($closed, $claimList['claim_id']);
            }


            $claim_data = Import_field::whereIN('claim_no', $closed)->where('claim_closing', 1);
        }

        $claim_data->leftjoin(DB::raw("(SELECT
          claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
        AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
        });

        $claim_data = $claim_data->get()->toArray();

        foreach ($claim_data as $key => $value) {

            $dob = $claim_data[$key]['created_at'];
            // $claim_age = Carbon::parse($dob)->age;

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

            $dob = $claim_data[$key]['created_at'];
            // $claim_age = Carbon::parse($dob)->age;

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


            $dos = strtotime($claim_data[$key]['dos']);

            if (!empty($dos) && $dos != 0000 - 00 - 00 && $dos != 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', $dos);
            }

            if ($dos == 0000 - 00 - 00) {
                $claim_data[$key]['dos'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $dob = strtotime($claim_data[$key]['dob']);

            if (!empty($dob) && $dob != 0000 - 00 - 00 && $dob != 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', $dob);
            }

            if ($dob == 0000 - 00 - 00) {
                $claim_data[$key]['dob'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dob == 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $admit_date = strtotime($claim_data[$key]['admit_date']);

            if (!empty($admit_date) && $admit_date != 0000 - 00 - 00 && $admit_date != 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', $admit_date);
            }

            if ($admit_date == 0000 - 00 - 00) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($admit_date == 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $discharge_date = strtotime($claim_data[$key]['discharge_date']);

            if (!empty($discharge_date) && $discharge_date != 0000 - 00 - 00 && $discharge_date != 1970 - 01 - 01) {

                $claim_data[$key]['discharge_date'] = date('m/d/Y', $discharge_date);
            }

            if ($discharge_date == 0000 - 00 - 00) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($discharge_date == 1970 - 01 - 01) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $total_ar = $claim_data[$key]['total_ar'];

            $claim_data[$key]['total_ar'] = number_format((float)$total_ar, 2, '.', '');

            $total_charges = $claim_data[$key]['total_charges'];

            $claim_data[$key]['total_charges'] = number_format((float)$total_charges, 2, '.', '');

            $pat_ar = $claim_data[$key]['pat_ar'];

            $claim_data[$key]['pat_ar'] = number_format((float)$pat_ar, 2, '.', '');

            $ins_ar = $claim_data[$key]['ins_ar'];

            $claim_data[$key]['ins_ar'] = number_format((float)$ins_ar, 2, '.', '');
        }


        return response()->json([
            'data'  => $claim_data
        ]);
    }

    public function fetch_billing_claims_export_data_pdf(LoginRequest $request)
    {

        $user_id = $request->get('user_id');
        $table_name = $request->get('table_name');

        $user_role = User::where('id', $user_id)->pluck('role_id');

        if ($user_role[0] == 5 || $user_role[0] == 3 || $user_role[0] == 2) {

            $users = User::where('role_id', '7')->orWhere('role_id', '3')->pluck('id');

            $claims = Claim_history::where('claim_state', '8')->distinct('claim_id')->pluck('claim_id');
            //dd($claims);
            //$claims=Action::whereIN('assigned_to', $users)->distinct('claim_id')-> offset($skip) ->limit($end)->pluck('claim_id');
            $claim_count = Action::whereIN('assigned_to', $users)->distinct('claim_id')->pluck('claim_id');
            $claim_count = sizeof($claim_count);
            // $claim_data= Import_field::whereIN('claim_no',$claims)->get();
            $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->distinct('claim_no');
        }

        $claim_data->leftjoin(DB::raw("(SELECT
              claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
            AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
        });

        $claim_data = $claim_data->get()->toArray();

        foreach ($claim_data as $key => $value) {

            $dob = $claim_data[$key]['created_at'];
            // $claim_age = Carbon::parse($dob)->age;

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

            $dos = strtotime($claim_data[$key]['dos']);

            if (!empty($dos) && $dos != 0000 - 00 - 00 && $dos != 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', $dos);
            }

            if ($dos == 0000 - 00 - 00) {
                $claim_data[$key]['dos'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $dob = strtotime($claim_data[$key]['dob']);

            if (!empty($dob) && $dob != 0000 - 00 - 00 && $dob != 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', $dob);
            }

            if ($dob == 0000 - 00 - 00) {
                $claim_data[$key]['dob'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dob == 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $admit_date = strtotime($claim_data[$key]['admit_date']);

            if (!empty($admit_date) && $admit_date != 0000 - 00 - 00 && $admit_date != 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', $admit_date);
            }

            if ($admit_date == 0000 - 00 - 00) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($admit_date == 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $discharge_date = strtotime($claim_data[$key]['discharge_date']);

            if (!empty($discharge_date) && $discharge_date != 0000 - 00 - 00 && $discharge_date != 1970 - 01 - 01) {

                $claim_data[$key]['discharge_date'] = date('m/d/Y', $discharge_date);
            }

            if ($discharge_date == 0000 - 00 - 00) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($discharge_date == 1970 - 01 - 01) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $total_ar = $claim_data[$key]['total_ar'];

            $claim_data[$key]['total_ar'] = number_format((float)$total_ar, 2, '.', '');

            $total_charges = $claim_data[$key]['total_charges'];

            $claim_data[$key]['total_charges'] = number_format((float)$total_charges, 2, '.', '');

            $pat_ar = $claim_data[$key]['pat_ar'];

            $claim_data[$key]['pat_ar'] = number_format((float)$pat_ar, 2, '.', '');

            $ins_ar = $claim_data[$key]['ins_ar'];

            $claim_data[$key]['ins_ar'] = number_format((float)$ins_ar, 2, '.', '');
        }

        return response()->json([
            'data'  => $claim_data
        ]);
    }

    public function fetch_client_claims_export_data_pdf(LoginRequest $request)
    {
        $user_id = $request->get('user_id');
        $table_name = $request->get('table_name');

        $user_role = User::where('id', $user_id)->first();

        if ($user_role['role_id'] == 5 || $user_role['role_id'] == 3 || $user_role['role_id'] == 2) {
            $users = User::where('role_id', '6')->orWhere('role_id', '3')->pluck('id');

            $claims = Claim_history::where('claim_state', '7')->distinct('claim_id')->pluck('claim_id');

            $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->distinct('claim_no');
        }

        $claim_data->leftjoin(DB::raw("(SELECT
              claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
            AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
        });

        $claim_data = $claim_data->get()->toArray();

        foreach ($claim_data as $key => $value) {

            $dob = $claim_data[$key]['created_at'];
            // $claim_age = Carbon::parse($dob)->age;

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

            $dos = strtotime($claim_data[$key]['dos']);

            if (!empty($dos) && $dos != 0000 - 00 - 00 && $dos != 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', $dos);
            }

            if ($dos == 0000 - 00 - 00) {
                $claim_data[$key]['dos'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            if ($dos == 1970 - 01 - 01) {
                $claim_data[$key]['dos'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $dob = strtotime($claim_data[$key]['dob']);

            if (!empty($dob) && $dob != 0000 - 00 - 00 && $dob != 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', $dob);
            }

            if ($dob == 0000 - 00 - 00) {
                $claim_data[$key]['dob'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($dob == 1970 - 01 - 01) {
                $claim_data[$key]['dob'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $admit_date = strtotime($claim_data[$key]['admit_date']);

            if (!empty($admit_date) && $admit_date != 0000 - 00 - 00 && $admit_date != 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', $admit_date);
            }

            if ($admit_date == 0000 - 00 - 00) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($admit_date == 1970 - 01 - 01) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $discharge_date = strtotime($claim_data[$key]['discharge_date']);

            if (!empty($discharge_date) && $discharge_date != 0000 - 00 - 00 && $discharge_date != 1970 - 01 - 01) {

                $claim_data[$key]['discharge_date'] = date('m/d/Y', $discharge_date);
            }

            if ($discharge_date == 0000 - 00 - 00) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 00 - 00 - 0000);
            }

            if ($discharge_date == 1970 - 01 - 01) {
                $claim_data[$key]['discharge_date'] = date('m/d/Y', 01 - 01 - 1970);
            }

            $total_ar = $claim_data[$key]['total_ar'];

            $claim_data[$key]['total_ar'] = number_format((float)$total_ar, 2, '.', '');

            $total_charges = $claim_data[$key]['total_charges'];

            $claim_data[$key]['total_charges'] = number_format((float)$total_charges, 2, '.', '');

            $pat_ar = $claim_data[$key]['pat_ar'];

            $claim_data[$key]['pat_ar'] = number_format((float)$pat_ar, 2, '.', '');

            $ins_ar = $claim_data[$key]['ins_ar'];

            $claim_data[$key]['ins_ar'] = number_format((float)$ins_ar, 2, '.', '');
        }

        return response()->json([
            'data'  => $claim_data
        ]);
    }

    public function fetch_work_order_export_data_pdf(LoginRequest $request)
    {


        $table_name = $request->get('table_name');

        if ($table_name == 'work_orders') {

            $wo_type = 1;

            $claim_data = Workorder_field::where('work_order_type', $wo_type);
        } elseif ($table_name == 'audit_work_order') {
            $wo_type = 2;

            $claim_data = Workorder_field::where('work_order_type', $wo_type);
        }

        $claim_data = $claim_data->get()->toArray();

        $id = 0;
        foreach ($claim_data as $key => $claim) {

            $created_at = strtotime($claim_data[$key]['created_at']);

            if (!empty($created_at)) {

                $claim_data[$key]['created_at'] = date('m/d/Y', $created_at);
            }

            $due_date = strtotime($claim_data[$key]['due_date']);

            if (!empty($due_date)) {

                $claim_data[$key]['due_date'] = date('m/d/Y', $due_date);
            }



            $claim_details = [];
            $total_ar_due = 0.00;
            $billed_amt = 0.00;
            $assigned_claims = Action::where('action_id', $claim['id'])->count();
            $assigned_claim_details = Action::where('action_id', $claim['id'])->get();

            if ($assigned_claims != 0) {
                foreach ($assigned_claim_details as $claims) {
                    $claim_details = Import_field::where('claim_no', $claims['claim_id'])->get();

                    if (sizeof($claim_details) != 0) {
                        $total_ar_due += floatval($claim_details[0]['total_ar']);
                        $billed_amt += floatval($claim_details[0]['total_charges']);
                    }
                }
            }

            $created = User::where('id', $claim['created_by'])->pluck('firstname');
            if (sizeOf($created) == 0) {
                $created = "NA";
            } else {
                $created = $created[0];
            }

            $claim_data[$id]['assigned_nos'] = $assigned_claims;
            $claim_data[$id]['created'] = $created;
            $claim_data[$id]['ar_due'] = number_format((float)$total_ar_due, 2, '.', '');
            $claim_data[$id]['billed'] = number_format((float)$billed_amt, 2, '.', '');
            $id++;
        }

        return response()->json([
            'data'  => $claim_data
        ]);
    }
}
