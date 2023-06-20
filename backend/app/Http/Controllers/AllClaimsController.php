<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\Action;
use App\Models\Claim_note;
use App\Models\Import_field;
use App\Models\Statuscode;
use App\Models\User;
use Carbon\Carbon;
use DateTime;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AllClaimsController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['all_claim_list']]);
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

    public function all_claim_list(LoginRequest $request)
    {
        try {
            $practice_dbid = $request->get('practice_dbid');
            $searchValue = $request->get('createsearch');

            $claim_data = Import_field::leftJoin('claim_histories', 'import_fields.claim_no', '=', 'claim_histories.claim_id')
                ->select('import_fields.*', 'claim_histories.claim_state', DB::raw('max(claim_histories.id) as max_id'), 'claim_histories.created_at as created_ats')
                ->groupBy('claim_histories.claim_id')
                ->orderByDesc('max_id');

            if (!empty($searchValue['claim_no']) && isset($searchValue['claim_no'])) {
                $claim_data->where('claim_no', $searchValue['claim_no']);
            }

            if (!empty($searchValue['acc_no']) && isset($searchValue['acc_no'])) {
                $claim_data->where('acct_no', $searchValue['acc_no']);
            }

            if (isset($searchValue['dos']) && $searchValue['dos']['startDate'] != null) {
                $dos_start_date = Carbon::createFromFormat('Y-m-d', $searchValue['dos']['startDate'])->startOfDay();
                $dos_end_date = Carbon::createFromFormat('Y-m-d', $searchValue['dos']['endDate'])->endOfDay();

                $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
            }

            if (!empty($searchValue['age_filter']) && $searchValue['age_filter'] != null) {
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

            if (!empty($searchValue['payer_name']) && isset($searchValue['payer_name'])) {
                $search_payer_name = $searchValue['payer_name'];

                $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
            }

            if (!empty($searchValue['claim_status']) && isset($searchValue['claim_status'])) {
                $claim_data->where('claim_Status', 'LIKE', '%' . $searchValue['claim_status'] . '%');
            }

            if (!empty($searchValue['patient_name']) && isset($searchValue['patient_name'])) {
                $search_patient_name = $searchValue['patient_name'];
                $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
            }

            if (!empty($searchValue['responsibility']) && isset($searchValue['responsibility'])) {
                $search_responsibility = $searchValue['responsibility'];
                $claim_data->where('responsibility', 'LIKE', '%' . $search_responsibility . '%');
            }

            if (!empty($searchValue['total_ar']) && isset($searchValue['total_ar'])) {
                $search_responsibility = $searchValue['total_ar'];
                $OriginalString = trim($searchValue['total_ar']);
                $tot_ar = explode("-", $OriginalString);

                $min_tot_ar = $tot_ar[0] - 1.00;
                $max_tot_ar = $tot_ar[1];

                $claim_data->whereBetween('total_ar', [$min_tot_ar, $max_tot_ar]);
            }

            if (!empty($searchValue['denial_code']) && isset($searchValue['denial_code'])) {
                $search_denial_code = $searchValue['denial_code'];
                $claim_data->where('denial_code', $search_denial_code);
            }

            if (!empty($searchValue['bill_submit_date']) && $searchValue['bill_submit_date']['startDate'] != null) {
                $search_submit_date = $searchValue['bill_submit_date'];

                $bill_start_date = Carbon::createFromFormat('Y-m-d', $search_submit_date['startDate'])->startOfDay();
                $bill_end_date = Carbon::createFromFormat('Y-m-d', $search_submit_date['endDate'])->endOfDay();

                $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
            }

            $claim_data = $claim_data->get();
            $total_count = $claim_data->count();


            if (isset($claim_data)) {
                foreach ($claim_data as $key => $value) {
                    $dos = strtotime($claim_data[$key]['dos']);

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

                    if ($value['status_code'] == null) {
                        $claim_data[$key]['status_code'] = "NA";
                    } else {
                        $status_code = Statuscode::where('id', $value['status_code'])->get();
                        $claim_data[$key]['status_code'] = $status_code[0]['status_code'] . "-" . $status_code[0]['description'];
                    }

                    $assigned_data = Action::where('claim_id', $claim_data[$key]['claim_no'])->orderBy('created_at', 'desc')->first();

                    $claim_data[$key]['touch'] = Claim_note::where('claim_id', $value['claim_no'])->count();
                }
            }

            return response()->json([
                'data'  => $claim_data,
                'total_count' => $total_count
            ]);
        } catch (Exception $e) {
            Log::debug('all claim list error :' . $e->getMessage());
        }
    }
}
