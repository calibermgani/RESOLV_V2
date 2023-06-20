<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Address_flag;
use App\Profile;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use Validator;
use JWTFactory;
use JWTAuth;
use App\Models\Import_field;
use App\Models\Statuscode;
use App\Models\Sub_statuscode;
use Carbon\Carbon;
use App\Models\Claim_note;
use Illuminate\Support\Facades\DB;
use Record_claim_history;
use App\Models\Workorder_field;
use App\Models\Action;
use App\Models\User_work_profile;
use DateTime;
use App\Models\Claim_history;
use Illuminate\Support\Facades\Response;
use Exception;
use Illuminate\Support\Facades\Log;

class Client_assistanceController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['get_ca_claims', 'get_user_list', 'create_ca_workorder', 'fetch_export_data', 'get_ca_payer_name']]);
    }

    public function get_ca_claims(LoginRequest $request)
    {
        $user_id = $request->get('user_id');
        $page_no = $request->get('page_no');
        $page_count = $request->get('count');
        $type = $request->get('type');
        $sort_data = $request->get('sort_data');
        // dd($sort_data); //true
        $sort_type = $request->get('sort_type');
        //dd($sort_type); //claim_no

        $sorting_name = $request->get('sorting_name');
        $sorting_method = $request->get('sorting_method');

        $searchValue = $request->get('claim_searh');

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
            $search_denial_code = $searchValue['denial_code'];
            $search_bill_submit_date = $searchValue['bill_submit_date'];
            $search_payer_name = $searchValue['payer_name'];
            $search_date = $searchValue['date'];
        }

        $search = $request->get('search');

        $total_count = 0;
        $skip = ($page_no - 1) * $page_count;
        //print_r($skip);
        $end = $page_count;

        $status_code = Statuscode::where('description', 'like', '%' . 'Client Assistance' . '%')->get();

        $user_role = User::where('id', $user_id)->first();

        if ($user_role['role_id'] == 5 || $user_role['role_id'] == 3 || $user_role['role_id'] == 2) {
            $users = User::where('role_id', '6')->orWhere('role_id', '3')->pluck('id');
            //dd($users);
            // $claims=Action::whereIN('assigned_to', $users)->distinct('claim_id')->pluck('claim_id');
            $claims = Claim_history::where('claim_state', '7')->distinct('claim_id')->pluck('claim_id');
            // $claims = Claim_history::where('claim_state','7')->orWhere('claim_state','4')->distinct('claim_id')->pluck('claim_id');

            $claim_count = Action::whereIN('assigned_to', $users)->distinct('claim_id')->pluck('claim_id');

            $claim_count = sizeof($claim_count);

            // $claim_data= Import_field::whereIN('claim_no',$claims)->get();
            //dd($claims);

            if ($searchValue == null) {

                if ($type == 'wo' && $sort_type == null && empty($sorting_name)) {

                    $skip = ($page_no - 1) * $page_count;
                    $end = $page_count;
                    $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                          claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                        AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                        $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                    })->leftjoin(DB::raw("(SELECT
                        claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                        $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                    })->leftjoin(DB::raw("(SELECT qc_notes.error_type FROM qc_notes WHERE qc_notes.deleted_at IS NULL AND GROUP BY qc_notes.claim_id)"), function ($join) {
                        $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                    })->leftJoin('qc_notes', function ($join) {
                        $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                    })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->distinct('claim_no')->offset($skip)->limit($end)->get();

                    foreach ($claim_data as $key => $claim_datas) {
                        $getStatusCode = Statuscode::where('id', $claim_datas['status_code'])->first();
                        $claim_data[$key]['statuscode'] = $getStatusCode->status_code ? $getStatusCode->status_code : 'NA';

                        $getSubStatusCode = Sub_statuscode::where('id', $claim_datas['substatus_code'])->first();
                        $claim_data[$key]['substatuscode'] = $getSubStatusCode->status_code ? $getSubStatusCode->status_code : 'NA';
                    }

                    $claim_count = Import_field::leftJoin('qc_notes', function ($join) {
                        $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                    })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->count();

                    $current_total = $claim_data->count();
                } elseif ($type == 'wo' && $sort_type == null && $sorting_name == 'null') {

                    $skip = ($page_no - 1) * $page_count;
                    $end = $page_count;
                    $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                          claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                        AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                        $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                    })->leftjoin(DB::raw("(SELECT
                        claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                        $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                    })->leftJoin('qc_notes', function ($join) {
                        $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                    })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->distinct('claim_no')->offset($skip)->limit($end)->get();

                    foreach ($claim_data as $key => $claim_datas) {
                        $getStatusCode = Statuscode::where('id', $claim_datas['status_code'])->first();
                        $claim_data[$key]['statuscode'] = $getStatusCode->status_code ? $getStatusCode->status_code : 'NA';

                        $getSubStatusCode = Sub_statuscode::where('id', $claim_datas['substatus_code'])->first();
                        $claim_data[$key]['substatuscode'] = $getSubStatusCode->status_code ? $getSubStatusCode->status_code : 'NA';
                    }

                    $claim_count = Import_field::leftJoin('qc_notes', function ($join) {
                        $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                    })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->count();

                    $current_total = $claim_data->count();
                } elseif ($type == 'wo' && $sort_type == null && !empty($sorting_name)) {
                    if ($sorting_method == true) {
                        $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                          claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                        AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                        })->leftjoin(DB::raw("(SELECT
                        claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                            $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                        })->leftJoin('qc_notes', function ($join) {
                            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                        })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end)->distinct('claim_no')->get();
                        foreach ($claim_data as $key => $claim_datas) {
                            $getStatusCode = Statuscode::where('id', $claim_datas['status_code'])->first();
                            $claim_data[$key]['statuscode'] = $getStatusCode->status_code ? $getStatusCode->status_code : 'NA';

                            $getSubStatusCode = Sub_statuscode::where('id', $claim_datas['substatus_code'])->first();
                            $claim_data[$key]['substatuscode'] = $getSubStatusCode->status_code ? $getSubStatusCode->status_code : 'NA';
                        }
                        $claim_count = Import_field::leftJoin('qc_notes', function ($join) {
                            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                        })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->count();

                        $current_total = $claim_data->count();
                    } else if ($sorting_method == false) {
                        $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                          claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                        AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                        })->leftjoin(DB::raw("(SELECT
                        claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                            $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                        })->leftJoin('qc_notes', function ($join) {
                            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                        })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end)->distinct('claim_no')->get();
                        foreach ($claim_data as $key => $claim_datas) {
                            $getStatusCode = Statuscode::where('id', $claim_datas['status_code'])->first();
                            $claim_data[$key]['statuscode'] = $getStatusCode->status_code ? $getStatusCode->status_code : 'NA';

                            $getSubStatusCode = Sub_statuscode::where('id', $claim_datas['substatus_code'])->first();
                            $claim_data[$key]['substatuscode'] = $getSubStatusCode->status_code ? $getSubStatusCode->status_code : 'NA';
                        }
                        $claim_count = Import_field::leftJoin('qc_notes', function ($join) {
                            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                        })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->count();
                        $current_total = $claim_data->count();
                    }
                } else if ($sort_type != 'null' && $sorting_name == 'null') {
                    if ($sort_data == true) {
                        $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                          claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                        AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                        })->leftjoin(DB::raw("(SELECT
                        claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                            $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                        })->leftJoin('qc_notes', function ($join) {
                            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                        })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->orderBy($sort_type, 'desc')->offset($skip)->limit($end)->distinct('claim_no')->get();
                        foreach ($claim_data as $key => $claim_datas) {
                            $getStatusCode = Statuscode::where('id', $claim_datas['status_code'])->first();
                            $claim_data[$key]['statuscode'] = $getStatusCode->status_code ? $getStatusCode->status_code : 'NA';

                            $getSubStatusCode = Sub_statuscode::where('id', $claim_datas['substatus_code'])->first();
                            $claim_data[$key]['substatuscode'] = $getSubStatusCode->status_code ? $getSubStatusCode->status_code : 'NA';
                        }

                        $claim_count = Import_field::leftJoin('qc_notes', function ($join) {
                            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                        })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->count();

                        $current_total = $claim_data->count();
                    } else if ($sort_data == false) {
                        $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                          claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                        AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                        })->leftjoin(DB::raw("(SELECT
                        claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                            $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                        })->leftJoin('qc_notes', function ($join) {
                            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                        })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->orderBy($sort_type, 'asc')->offset($skip)->limit($end)->distinct('claim_no')->get();
                        foreach ($claim_data as $key => $claim_datas) {
                            $getStatusCode = Statuscode::where('id', $claim_datas['status_code'])->first();
                            $claim_data[$key]['statuscode'] = $getStatusCode->status_code ? $getStatusCode->status_code : 'NA';

                            $getSubStatusCode = Sub_statuscode::where('id', $claim_datas['substatus_code'])->first();
                            $claim_data[$key]['substatuscode'] = $getSubStatusCode->status_code ? $getSubStatusCode->status_code : 'NA';
                        }
                        $claim_count = Import_field::leftJoin('qc_notes', function ($join) {
                            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                        })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->count();
                        $current_total = $claim_data->count();
                    }
                }

                $selected_claim_data = Import_field::leftJoin('qc_notes', function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->distinct('claim_no')->get();
                //$claim_count=sizeof($claim_data);


                // $claim_data= Import_field::where('status_code',$status_code[0]['id'])->orderBy('id', 'asc')-> offset($skip) ->limit($end)->get();
                // $claim_count= Import_field::where('status_code',$status_code[0]['id'])->count();

            } elseif ($searchValue != null) {

                $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                      claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                    AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
                        claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                    $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                })->leftJoin('qc_notes', function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance');

                $claim_count = Import_field::leftjoin(DB::raw("(SELECT
                      claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                    AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
                        claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                    $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                })->leftJoin('qc_notes', function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance');

                $selected_claim_data = Import_field::leftjoin(DB::raw("(SELECT
                      claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                    AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
                        claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                    $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                })->leftJoin('qc_notes', function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance');

                if (!empty($search_claim_no)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('claim_no', $search_claim_no)->offset($skip)->limit($end);

                        $claim_count->where('claim_no', $search_claim_no);

                        $selected_claim_data->where('claim_no', $search_claim_no);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('claim_no', $search_claim_no)->offset($skip)->limit($end);

                        $claim_count->where('claim_no', $search_claim_no);

                        $selected_claim_data->where('claim_no', $search_claim_no);
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('claim_no', $search_claim_no)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('claim_no', $search_claim_no);

                        $selected_claim_data->where('claim_no', $search_claim_no);
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('claim_no', $search_claim_no)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('claim_no', $search_claim_no);

                        $selected_claim_data->where('claim_no', $search_claim_no);
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('claim_no', $search_claim_no)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('claim_no', $search_claim_no);

                        $selected_claim_data->where('claim_no', 'LIKE', '%' . $search_claim_no . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('claim_no', $search_claim_no)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('claim_no', $search_claim_no);

                        $selected_claim_data->where('claim_no', $search_claim_no);
                    }
                }

                if (!empty($search_acc_no)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('acct_no', $search_acc_no)->offset($skip)->limit($end);

                        $claim_count->where('acct_no', $search_acc_no);

                        $selected_claim_data->where('acct_no', $search_acc_no);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('acct_no', $search_acc_no)->offset($skip)->limit($end);

                        $claim_count->where('acct_no', $search_acc_no);

                        $selected_claim_data->where('acct_no', $search_acc_no);
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('acct_no', $search_acc_no)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('acct_no', $search_acc_no);

                        $selected_claim_data->where('acct_no', $search_acc_no);
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('acct_no', $search_acc_no)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('acct_no', $search_acc_no);

                        $selected_claim_data->where('acct_no', $search_acc_no);
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('acct_no', $search_acc_no)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('acct_no', $search_acc_no);

                        $selected_claim_data->where('acct_no', $search_acc_no);
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('acct_no', $search_acc_no)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('acct_no', $search_acc_no);

                        $selected_claim_data->where('acct_no', $search_acc_no);
                    }
                }

                if (!empty($search_dos) && $search_dos['startDate'] != null) {

                    $sart_date = date('Y-m-d', strtotime($search_dos['startDate']));
                    $end_date = date('Y-m-d', strtotime($search_dos['endDate']));

                    if ($sart_date == $end_date) {
                        $dos_sart_date = date('Y-m-d', strtotime($search_dos['startDate'] . "+ 1 day"));
                        $dos_end_date = date('Y-m-d', strtotime($search_dos['endDate'] . "+ 1 day"));
                    } elseif ($sart_date != $end_date) {
                        $dos_sart_date = date('Y-m-d', strtotime($search_dos['startDate'] . "+ 1 day"));
                        $dos_end_date = date('Y-m-d', strtotime($search_dos['endDate']));
                    }

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->offset($skip)->limit($end);

                        $claim_count->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);

                        $selected_claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->offset($skip)->limit($end);

                        $claim_count->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);

                        $selected_claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);

                        $selected_claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);

                        $selected_claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);

                        $selected_claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);

                        $selected_claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    }
                }

                if (!empty($search_date) && $search_date['startDate'] != null) {

                    $sart_date = date('Y-m-d', strtotime($search_date['startDate']));
                    $end_date = date('Y-m-d', strtotime($search_date['endDate']));

                    if ($sart_date == $end_date) {
                        $created_start_date = date('Y-m-d', strtotime($search_date['startDate'] . "+ 1 day"));
                        $created_end_date = date('Y-m-d', strtotime($search_date['endDate'] . "+ 1 day"));
                    } elseif ($sart_date != $end_date) {
                        $created_start_date = date('Y-m-d', strtotime($search_date['startDate'] . "+ 1 day"));
                        $created_end_date = date('Y-m-d', strtotime($search_date['endDate']));
                    }

                    if ($sort_data == null && $sort_type == null) {
                        $claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date)->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                        $selected_claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {
                        $claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date)->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                        $selected_claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {
                        $claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                        $selected_claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {
                        $claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                        $selected_claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {
                        $claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                        $selected_claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {
                        $claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                        $selected_claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                    }
                }

                if (!empty($search_patient_name)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');

                        $selected_claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');

                        $selected_claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');

                        $selected_claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');

                        $selected_claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');

                        $selected_claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');

                        $selected_claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                    }
                }

                if (!empty($search_total_charge)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('total_charges', '=', $search_total_charge)->offset($skip)->limit($end);

                        $claim_count->where('total_charges', '=', $search_total_charge);

                        $selected_claim_data->where('total_charges', '=', $search_total_charge);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('total_charges', '=', $search_total_charge)->offset($skip)->limit($end);

                        $claim_count->where('total_charges', '=', $search_total_charge);

                        $selected_claim_data->where('total_charges', '=', $search_total_charge);
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('total_charges', '=', $search_total_charge)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('total_charges', '=', $search_total_charge);

                        $selected_claim_data->where('total_charges', '=', $search_total_charge);
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('total_charges', '=', $search_total_charge)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('total_charges', '=', $search_total_charge);

                        $selected_claim_data->where('total_charges', '=', $search_total_charge);
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('total_charges', '=', $search_total_charge)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('total_charges', '=', $search_total_charge);

                        $selected_claim_data->where('total_charges', '=', $search_total_charge);
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('total_charges', '=', $search_total_charge)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('total_charges', '=', $search_total_charge);

                        $selected_claim_data->where('total_charges', '=', $search_total_charge);
                    }
                }

                if (!empty($search_total_ar)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('total_ar', '=', $search_total_ar)->offset($skip)->limit($end);

                        $claim_count->where('total_ar', '=', $search_total_ar);

                        $selected_claim_data->where('total_ar', '=', $search_total_ar);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('total_ar', '=', $search_total_ar)->offset($skip)->limit($end);

                        $claim_count->where('total_ar', '=', $search_total_ar);

                        $selected_claim_data->where('total_ar', '=', $search_total_ar);
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('total_ar', '=', $search_total_ar)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('total_ar', '=', $search_total_ar);

                        $selected_claim_data->where('total_ar', '=', $search_total_ar);
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('total_ar', '=', $search_total_ar)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('total_ar', '=', $search_total_ar);

                        $selected_claim_data->where('total_ar', '=', $search_total_ar);
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('total_ar', '=', $search_total_ar)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('total_ar', '=', $search_total_ar);

                        $selected_claim_data->where('total_ar', '=', $search_total_ar);
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('total_ar', '=', $search_total_ar)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('total_ar', '=', $search_total_ar);

                        $selected_claim_data->where('total_ar', '=', $search_total_ar);
                    }
                }

                if (!empty($search_claim_note)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%')->offset($skip)->limit($end);

                        $claim_count->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');

                        $selected_claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%')->offset($skip)->limit($end);

                        $claim_count->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');

                        $selected_claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');

                        $selected_claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');

                        $selected_claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');

                        $selected_claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');

                        $selected_claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                    }
                }

                // if(!empty($search_insurance)){

                //   if($sort_data == null && $sort_type == null){

                //     $claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%')-> offset($skip) ->limit($end);

                //     $claim_count->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                //     $selected_claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%');
                //   }

                //   if($sort_type != 'null' && $sort_type == null && empty($sorting_name)){

                //     $claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%')-> offset($skip) ->limit($end);

                //     $claim_count->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                //     $selected_claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%');
                //   }

                //   if($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null){

                //     $claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%')->orderBy($sort_type, 'asc')-> offset($skip) ->limit($end);

                //     $claim_count->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                //     $selected_claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                //   }else if($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null){

                //     $claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%')->orderBy($sort_type, 'desc')-> offset($skip) ->limit($end);

                //     $claim_count->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                //     $selected_claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%');
                //   }

                //   if($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)){

                //     $claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%')->orderBy($sorting_name, 'asc')-> offset($skip) ->limit($end);

                //     $claim_count->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                //     $selected_claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                //   }else if($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)){

                //     $claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%')->orderBy($sorting_name, 'desc')-> offset($skip) ->limit($end);

                //     $claim_count->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                //     $selected_claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%');
                //   }

                // }

                if (!empty($search_prim_ins_name)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');

                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');

                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');

                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');

                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');

                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');

                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                    }
                }

                if (!empty($search_prim_pol_id)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%')->offset($skip)->limit($end);

                        $claim_count->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');

                        $selected_claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%')->offset($skip)->limit($end);

                        $claim_count->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');

                        $selected_claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');

                        $selected_claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');

                        $selected_claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');

                        $selected_claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');

                        $selected_claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                    }
                }

                if (!empty($search_sec_ins_name)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');

                        $selected_claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');

                        $selected_claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');

                        $selected_claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');

                        $selected_claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');

                        $selected_claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');

                        $selected_claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                    }
                }

                if (!empty($search_sec_pol_id)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%')->offset($skip)->limit($end);

                        $claim_count->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');

                        $selected_claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%')->offset($skip)->limit($end);

                        $claim_count->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');

                        $selected_claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');

                        $selected_claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');

                        $selected_claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');

                        $selected_claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');

                        $selected_claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                    }
                }

                if (!empty($search_ter_ins_name)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');

                        $selected_claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');

                        $selected_claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');

                        $selected_claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');

                        $selected_claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');

                        $selected_claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');

                        $selected_claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                    }
                }

                if (!empty($search_ter_pol_id)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%')->offset($skip)->limit($end);

                        $claim_count->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');

                        $selected_claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%')->offset($skip)->limit($end);

                        $claim_count->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');

                        $selected_claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');

                        $selected_claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');

                        $selected_claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');

                        $selected_claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');

                        $selected_claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                    }
                } else {
                    if (!empty($sorting_name)) {

                        if ($sorting_method == true) {
                            $claim_data->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);
                            $claim_count->orderBy($sorting_name, 'desc');
                            $selected_claim_data->orderBy($sorting_name, 'desc');
                        } else if ($sorting_method == false) {
                            $claim_data->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);
                            $claim_count->orderBy($sorting_name, 'asc');
                            $selected_claim_data->orderBy($sorting_name, 'asc');
                        }
                    }
                }

                if (!empty($search_denial_code)) {
                    if ($sort_data == null && $sort_type == null) {
                        $claim_data->where('denial_code', $search_denial_code)->offset($skip)->limit($end);
                        $claim_count->where('denial_code', $search_denial_code);
                        $selected_claim_data->where('denial_code', $search_denial_code);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {
                        $claim_data->where('denial_code', $search_denial_code)->offset($skip)->limit($end);
                        $claim_count->where('denial_code', $search_denial_code);
                        $selected_claim_data->where('denial_code', $search_denial_code);
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {
                        $claim_data->where('denial_code', $search_denial_code)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);
                        $claim_count->where('denial_code', $search_denial_code);
                        $selected_claim_data->where('denial_code', $search_denial_code);
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {
                        $claim_data->where('denial_code', $search_denial_code)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);
                        $claim_count->where('denial_code', $search_denial_code);
                        $selected_claim_data->where('denial_code', $search_denial_code);
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {
                        $claim_data->where('denial_code', $search_denial_code)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);
                        $claim_count->where('denial_code', $search_denial_code);
                        $selected_claim_data->where('denial_code', $search_denial_code);
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {
                        $claim_data->where('denial_code', $search_denial_code)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);
                        $claim_count->where('denial_code', $search_denial_code);
                        $selected_claim_data->where('denial_code', $search_denial_code);
                    }
                }

                if (!empty($search_bill_submit_date) && $search_bill_submit_date['startDate'] != null) {

                    $create_sart_date = date('Y-m-d', strtotime($search_bill_submit_date['startDate']));
                    $create_end_date = date('Y-m-d', strtotime($search_bill_submit_date['endDate']));


                    if ($create_sart_date == $create_end_date) {
                        $bill_start_date = date('Y-m-d', strtotime($search_bill_submit_date['startDate'] . "+ 1 day"));
                        $bill_end_date = date('Y-m-d', strtotime($search_bill_submit_date['endDate'] . "+ 1 day"));
                    } elseif ($create_sart_date != $create_end_date) {
                        $bill_start_date = date('Y-m-d', strtotime($search_bill_submit_date['startDate'] . "+ 1 day"));
                        $bill_end_date = date('Y-m-d', strtotime($search_bill_submit_date['endDate']));
                    }

                    if ($sort_data == null && $sort_type == null) {
                        $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date)->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                        $selected_claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {
                        $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date)->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                        $selected_claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {
                        $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                        $selected_claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {
                        $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                        $selected_claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {
                        $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                        $selected_claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {
                        $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                        $selected_claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                    }
                }

                if (!empty($search_payer_name)) {
                    if ($sort_data == null && $sort_type == null) {
                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%')->offset($skip)->limit($end);
                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%')->offset($skip)->limit($end);
                        $claim_count->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%')->offset($skip)->limit($end);
                        $claim_count->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {
                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%')->offset($skip)->limit($end);
                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%')->offset($skip)->limit($end);
                        $claim_count->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%')->offset($skip)->limit($end);
                        $claim_count->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {
                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);
                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);
                        $claim_count->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);
                        $claim_count->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {
                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);
                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);
                        $claim_count->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);
                        $claim_count->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {
                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);
                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);
                        $claim_count->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);
                        $claim_count->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {
                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);
                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);
                        $claim_count->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);
                        $claim_count->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                    }
                }


                // DB::enableQueryLog();
                $claim_data = $claim_data->get();
                // $query = DB::getQueryLog();
                // dd($query);

                foreach ($claim_data as $key => $claim_datas) {
                    $getStatusCode = Statuscode::where('id', $claim_datas['status_code'])->first();
                    $claim_data[$key]['statuscode'] = $getStatusCode->status_code ? $getStatusCode->status_code : 'NA';

                    $getSubStatusCode = Sub_statuscode::where('id', $claim_datas['substatus_code'])->first();
                    $claim_data[$key]['substatuscode'] = $getSubStatusCode->status_code ? $getSubStatusCode->status_code : 'NA';
                }

                $current_total = $claim_data->count();

                $claim_count = $claim_count->count();

                $selected_claim_data = $selected_claim_data->get();

                $selected_count = $selected_claim_data->count();

                $type = 'wo';
            }
        } else if ($user_role['role_id'] == 4 || $user_role['role_id'] == 1) {

            $users = User::where('role_id', '4')->orWhere('role_id', '1')->pluck('id');

            $claims = Claim_history::where('claim_state', '7')->where('assigned_to', $user_id)->distinct('claim_id')->pluck('claim_id');

            $claim_count = Action::whereIN('assigned_to', $users)->distinct('claim_id')->pluck('claim_id');

            $claim_count = sizeof($claim_count);

            if ($searchValue == null) {

                if ($type == 'wo' && $sort_type == null && empty($sorting_name)) {

                    $skip = ($page_no - 1) * $page_count;
                    $end = $page_count;
                    $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                          claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                        AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                        $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                    })->leftjoin(DB::raw("(SELECT
                        claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                        $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                    })->leftJoin('qc_notes', function ($join) {
                        $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                    })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->distinct('claim_no')->offset($skip)->limit($end)->get();

                    foreach ($claim_data as $key => $claim_datas) {
                        $getStatusCode = Statuscode::where('id', $claim_datas['status_code'])->first();
                        $claim_data[$key]['statuscode'] = $getStatusCode->status_code ? $getStatusCode->status_code : 'NA';

                        $getSubStatusCode = Sub_statuscode::where('id', $claim_datas['substatus_code'])->first();
                        $claim_data[$key]['substatuscode'] = $getSubStatusCode->status_code ? $getSubStatusCode->status_code : 'NA';
                    }

                    $claim_count = Import_field::leftJoin('qc_notes', function ($join) {
                        $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                    })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->count();

                    $current_total = $claim_data->count();
                } elseif ($type == 'wo' && $sort_type == null && $sorting_name == 'null') {

                    $skip = ($page_no - 1) * $page_count;
                    $end = $page_count;
                    // DB::enableQueryLog();
                    $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                          claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                        AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                        $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                    })->leftjoin(DB::raw("(SELECT
                        claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                        $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                    })->leftJoin('qc_notes', function ($join) {
                        $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                    })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->distinct('claim_no')->offset($skip)->limit($end)->get();
                    // $quries = DB::getQueryLog();
                    // dd($quries);
                    foreach ($claim_data as $key => $claim_datas) {
                        $getStatusCode = Statuscode::where('id', $claim_datas['status_code'])->first();
                        $claim_data[$key]['statuscode'] = $getStatusCode->status_code ? $getStatusCode->status_code : 'NA';

                        $getSubStatusCode = Sub_statuscode::where('id', $claim_datas['substatus_code'])->first();
                        $claim_data[$key]['substatuscode'] = $getSubStatusCode->status_code ? $getSubStatusCode->status_code : 'NA';
                    }

                    $claim_count = Import_field::leftJoin('qc_notes', function ($join) {
                        $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                    })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->count();

                    $current_total = $claim_data->count();
                } elseif ($type == 'wo' && $sort_type == null && !empty($sorting_name)) {

                    if ($sorting_method == true) {
                        $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                          claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                        AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                        })->leftjoin(DB::raw("(SELECT
                        claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                            $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                        })->leftJoin('qc_notes', function ($join) {
                            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                        })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end)->distinct('claim_no')->get();
                        foreach ($claim_data as $key => $claim_datas) {
                            $getStatusCode = Statuscode::where('id', $claim_datas['status_code'])->first();
                            $claim_data[$key]['statuscode'] = $getStatusCode->status_code ? $getStatusCode->status_code : 'NA';

                            $getSubStatusCode = Sub_statuscode::where('id', $claim_datas['substatus_code'])->first();
                            $claim_data[$key]['substatuscode'] = $getSubStatusCode->status_code ? $getSubStatusCode->status_code : 'NA';
                        }
                        $claim_count = Import_field::leftJoin('qc_notes', function ($join) {
                            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                        })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->count();

                        $current_total = $claim_data->count();
                    } else if ($sorting_method == false) {
                        $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                          claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                        AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                        })->leftjoin(DB::raw("(SELECT
                        claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                            $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                        })->leftJoin('qc_notes', function ($join) {
                            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                        })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end)->distinct('claim_no')->get();
                        foreach ($claim_data as $key => $claim_datas) {
                            $getStatusCode = Statuscode::where('id', $claim_datas['status_code'])->first();
                            $claim_data[$key]['statuscode'] = $getStatusCode->status_code ? $getStatusCode->status_code : 'NA';

                            $getSubStatusCode = Sub_statuscode::where('id', $claim_datas['substatus_code'])->first();
                            $claim_data[$key]['substatuscode'] = $getSubStatusCode->status_code ? $getSubStatusCode->status_code : 'NA';
                        }
                        $claim_count = Import_field::leftJoin('qc_notes', function ($join) {
                            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                        })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->count();
                        $current_total = $claim_data->count();
                    }
                } else if ($sort_type != 'null' && $sorting_name == 'null') {
                    if ($sort_data == true) {
                        $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                          claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                        AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                        })->leftJoin('qc_notes', function ($join) {
                            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                        })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->orderBy($sort_type, 'desc')->offset($skip)->limit($end)->distinct('claim_no')->get();
                        foreach ($claim_data as $key => $claim_datas) {
                            $getStatusCode = Statuscode::where('id', $claim_datas['status_code'])->first();
                            $claim_data[$key]['statuscode'] = $getStatusCode->status_code ? $getStatusCode->status_code : 'NA';

                            $getSubStatusCode = Sub_statuscode::where('id', $claim_datas['substatus_code'])->first();
                            $claim_data[$key]['substatuscode'] = $getSubStatusCode->status_code ? $getSubStatusCode->status_code : 'NA';
                        }
                        $claim_count = Import_field::leftJoin('qc_notes', function ($join) {
                            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                        })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->count();

                        $current_total = $claim_data->count();
                    } else if ($sort_data == false) {
                        $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                          claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                        AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                        })->leftjoin(DB::raw("(SELECT
                        claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                            $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                        })->leftJoin('qc_notes', function ($join) {
                            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                        })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->orderBy($sort_type, 'asc')->offset($skip)->limit($end)->distinct('claim_no')->get();
                        foreach ($claim_data as $key => $claim_datas) {
                            $getStatusCode = Statuscode::where('id', $claim_datas['status_code'])->first();
                            $claim_data[$key]['statuscode'] = $getStatusCode->status_code ? $getStatusCode->status_code : 'NA';

                            $getSubStatusCode = Sub_statuscode::where('id', $claim_datas['substatus_code'])->first();
                            $claim_data[$key]['substatuscode'] = $getSubStatusCode->status_code ? $getSubStatusCode->status_code : 'NA';
                        }
                        $claim_count = Import_field::leftJoin('qc_notes', function ($join) {
                            $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                        })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->count();
                        $current_total = $claim_data->count();
                    }
                }

                $selected_claim_data = Import_field::leftJoin('qc_notes', function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->distinct('claim_no')->get();
                //$claim_count=sizeof($claim_data);


                // $claim_data= Import_field::where('status_code',$status_code[0]['id'])->orderBy('id', 'asc')-> offset($skip) ->limit($end)->get();
                // $claim_count= Import_field::where('status_code',$status_code[0]['id'])->count();

                $selected_claim_data = Import_field::leftJoin('qc_notes', function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance')->where('assigned_to', $user_id)->distinct('claim_no')->get();
            } elseif ($searchValue != null) {

                $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                      claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                    AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
                        claim_histories.claim_id,claim_histories.created_at as created_ats
                      FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                      ) as claim_histories"), function ($join) {
                    $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                })->leftJoin('qc_notes', function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance');

                $claim_count = Import_field::leftJoin('qc_notes', function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance');

                $selected_claim_data = Import_field::leftJoin('qc_notes', function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->where('qc_notes.deleted_at', '=', NULL)->where('qc_notes.error_type', '=', '[1]')->whereIN('claim_no', $claims)->where('claim_Status', 'Client Assistance');

                if (!empty($search_claim_no)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('claim_no', $search_claim_no)->offset($skip)->limit($end);

                        $claim_count->where('claim_no', $search_claim_no);

                        $selected_claim_data->where('claim_no', $search_claim_no);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('claim_no', $search_claim_no)->offset($skip)->limit($end);

                        $claim_count->where('claim_no', $search_claim_no);

                        $selected_claim_data->where('claim_no', $search_claim_no);
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('claim_no', $search_claim_no)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('claim_no', $search_claim_no);

                        $selected_claim_data->where('claim_no', $search_claim_no);
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('claim_no', $search_claim_no)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('claim_no', $search_claim_no);

                        $selected_claim_data->where('claim_no', $search_claim_no);
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('claim_no', $search_claim_no)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('claim_no', $search_claim_no);

                        $selected_claim_data->where('claim_no', $search_claim_no);
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('claim_no', $search_claim_no)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('claim_no', $search_claim_no);

                        $selected_claim_data->where('claim_no', $search_claim_no);
                    }
                }

                if (!empty($search_acc_no)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%')->offset($skip)->limit($end);

                        $claim_count->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');

                        $selected_claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%')->offset($skip)->limit($end);

                        $claim_count->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');

                        $selected_claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');

                        $selected_claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');

                        $selected_claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');

                        $selected_claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');

                        $selected_claim_data->where('acct_no', 'LIKE', '%' . $search_acc_no . '%');
                    }
                }

                if (!empty($search_dos) && $search_dos['startDate'] != null) {
                    $create_sart_date = date('Y-m-d', strtotime($search_dos['startDate']));
                    $create_end_date = date('Y-m-d', strtotime($search_dos['endDate']));

                    if ($create_sart_date == $create_end_date) {
                        $dos_sart_date = date('Y-m-d', strtotime($search_dos['startDate'] . "+ 1 day"));
                        $dos_end_date = date('Y-m-d', strtotime($search_dos['endDate'] . "+ 1 day"));
                    } elseif ($create_sart_date != $create_end_date) {
                        $dos_sart_date = date('Y-m-d', strtotime($search_dos['startDate'] . "+ 1 day"));
                        $dos_end_date = date('Y-m-d', strtotime($search_dos['endDate']));
                    }

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->offset($skip)->limit($end);

                        $claim_count->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);

                        $selected_claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->offset($skip)->limit($end);

                        $claim_count->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);

                        $selected_claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);

                        $selected_claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);

                        $selected_claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);

                        $selected_claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);

                        $selected_claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    }
                }

                if (!empty($search_date) && $search_date['startDate'] != null) {

                    $sart_date = date('Y-m-d', strtotime($search_date['startDate']));
                    $end_date = date('Y-m-d', strtotime($search_date['endDate']));

                    if ($sart_date == $end_date) {
                        $created_start_date = date('Y-m-d', strtotime($search_date['startDate'] . "+ 1 day"));
                        $created_end_date = date('Y-m-d', strtotime($search_date['endDate'] . "+ 1 day"));
                    } elseif ($sart_date != $end_date) {
                        $created_start_date = date('Y-m-d', strtotime($search_date['startDate'] . "+ 1 day"));
                        $created_end_date = date('Y-m-d', strtotime($search_date['endDate']));
                    }

                    if ($sort_data == null && $sort_type == null) {
                        $claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date)->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                        $selected_claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {
                        $claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date)->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                        $selected_claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {
                        $claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                        $selected_claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {
                        $claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                        $selected_claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {
                        $claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                        $selected_claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {
                        $claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                        $selected_claim_data->where(DB::raw('DATE(claim_histories.created_ats)'), '>=', $created_start_date)->where(DB::raw('DATE(claim_histories.created_ats)'), '<=', $created_end_date);
                    }
                }

                if (!empty($search_patient_name)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');

                        $selected_claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');

                        $selected_claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');

                        $selected_claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');

                        $selected_claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');

                        $selected_claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');

                        $selected_claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                    }
                }

                if (!empty($search_total_charge)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('total_charges', '=', $search_total_charge)->offset($skip)->limit($end);

                        $claim_count->where('total_charges', '=', $search_total_charge);

                        $selected_claim_data->where('total_charges', '=', $search_total_charge);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('total_charges', '=', $search_total_charge)->offset($skip)->limit($end);

                        $claim_count->where('total_charges', '=', $search_total_charge);

                        $selected_claim_data->where('total_charges', '=', $search_total_charge);
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('total_charges', '=', $search_total_charge)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('total_charges', '=', $search_total_charge);

                        $selected_claim_data->where('total_charges', '=', $search_total_charge);
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('total_charges', '=', $search_total_charge)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('total_charges', '=', $search_total_charge);

                        $selected_claim_data->where('total_charges', '=', $search_total_charge);
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('total_charges', '=', $search_total_charge)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('total_charges', '=', $search_total_charge);

                        $selected_claim_data->where('total_charges', '=', $search_total_charge);
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('total_charges', '=', $search_total_charge)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('total_charges', '=', $search_total_charge);

                        $selected_claim_data->where('total_charges', '=', $search_total_charge);
                    }
                }

                if (!empty($search_total_ar)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('total_ar', '=', $search_total_ar)->offset($skip)->limit($end);

                        $claim_count->where('total_ar', '=', $search_total_ar);

                        $selected_claim_data->where('total_ar', '=', $search_total_ar);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('total_ar', '=', $search_total_ar)->offset($skip)->limit($end);

                        $claim_count->where('total_ar', '=', $search_total_ar);

                        $selected_claim_data->where('total_ar', '=', $search_total_ar);
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('total_ar', '=', $search_total_ar)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('total_ar', '=', $search_total_ar);

                        $selected_claim_data->where('total_ar', '=', $search_total_ar);
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('total_ar', '=', $search_total_ar)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('total_ar', '=', $search_total_ar);

                        $selected_claim_data->where('total_ar', '=', $search_total_ar);
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('total_ar', '=', $search_total_ar)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('total_ar', '=', $search_total_ar);

                        $selected_claim_data->where('total_ar', '=', $search_total_ar);
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('total_ar', '=', $search_total_ar)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('total_ar', '=', $search_total_ar);

                        $selected_claim_data->where('total_ar', '=', $search_total_ar);
                    }
                }

                if (!empty($search_claim_note)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%')->offset($skip)->limit($end);

                        $claim_count->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');

                        $selected_claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%')->offset($skip)->limit($end);

                        $claim_count->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');

                        $selected_claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');

                        $selected_claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');

                        $selected_claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');

                        $selected_claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');

                        $selected_claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                    }
                }

                if (!empty($search_insurance)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%')->offset($skip)->limit($end);

                        $claim_count->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                        $selected_claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%')->offset($skip)->limit($end);

                        $claim_count->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                        $selected_claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                        $selected_claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                        $selected_claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                        $selected_claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                        $selected_claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%');
                    }
                }

                if (!empty($search_prim_ins_name)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');

                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');

                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');

                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');

                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');

                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');

                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                    }
                }

                if (!empty($search_prim_pol_id)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%')->offset($skip)->limit($end);

                        $claim_count->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');

                        $selected_claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%')->offset($skip)->limit($end);

                        $claim_count->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');

                        $selected_claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');

                        $selected_claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');

                        $selected_claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');

                        $selected_claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');

                        $selected_claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                    }
                }

                if (!empty($search_sec_ins_name)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');

                        $selected_claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');

                        $selected_claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');

                        $selected_claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');

                        $selected_claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');

                        $selected_claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');

                        $selected_claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                    }
                }

                if (!empty($search_sec_pol_id)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%')->offset($skip)->limit($end);

                        $claim_count->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');

                        $selected_claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%')->offset($skip)->limit($end);

                        $claim_count->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');

                        $selected_claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');

                        $selected_claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');

                        $selected_claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');

                        $selected_claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');

                        $selected_claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                    }
                }

                if (!empty($search_ter_ins_name)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');

                        $selected_claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');

                        $selected_claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');

                        $selected_claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');

                        $selected_claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');

                        $selected_claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');

                        $selected_claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                    }
                }

                if (!empty($search_ter_pol_id)) {

                    if ($sort_data == null && $sort_type == null) {

                        $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%')->offset($skip)->limit($end);

                        $claim_count->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');

                        $selected_claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%')->offset($skip)->limit($end);

                        $claim_count->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');

                        $selected_claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');

                        $selected_claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');

                        $selected_claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');

                        $selected_claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');

                        $selected_claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                    }
                }

                if (!empty($search_denial_code)) {
                    if ($sort_data == null && $sort_type == null) {
                        $claim_data->where('denial_code', $search_denial_code)->offset($skip)->limit($end);
                        $claim_count->where('denial_code', $search_denial_code);
                        $selected_claim_data->where('denial_code', $search_denial_code);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {
                        $claim_data->where('denial_code', $search_denial_code)->offset($skip)->limit($end);
                        $claim_count->where('denial_code', $search_denial_code);
                        $selected_claim_data->where('denial_code', $search_denial_code);
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {
                        $claim_data->where('denial_code', $search_denial_code)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);
                        $claim_count->where('denial_code', $search_denial_code);
                        $selected_claim_data->where('denial_code', $search_denial_code);
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {
                        $claim_data->where('denial_code', $search_denial_code)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);
                        $claim_count->where('denial_code', $search_denial_code);
                        $selected_claim_data->where('denial_code', $search_denial_code);
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {
                        $claim_data->where('denial_code', $search_denial_code)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);
                        $claim_count->where('denial_code', $search_denial_code);
                        $selected_claim_data->where('denial_code', $search_denial_code);
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {
                        $claim_data->where('denial_code', $search_denial_code)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);
                        $claim_count->where('denial_code', $search_denial_code);
                        $selected_claim_data->where('denial_code', $search_denial_code);
                    }
                }

                if (!empty($search_bill_submit_date) && $search_bill_submit_date['startDate'] != null) {

                    $create_sart_date = date('Y-m-d', strtotime($search_bill_submit_date['startDate']));
                    $create_end_date = date('Y-m-d', strtotime($search_bill_submit_date['endDate']));


                    if ($create_sart_date == $create_end_date) {
                        $bill_start_date = date('Y-m-d', strtotime($search_bill_submit_date['startDate'] . "+ 1 day"));
                        $bill_end_date = date('Y-m-d', strtotime($search_bill_submit_date['endDate'] . "+ 1 day"));
                    } elseif ($create_sart_date != $create_end_date) {
                        $bill_start_date = date('Y-m-d', strtotime($search_bill_submit_date['startDate'] . "+ 1 day"));
                        $bill_end_date = date('Y-m-d', strtotime($search_bill_submit_date['endDate']));
                    }

                    if ($sort_data == null && $sort_type == null) {
                        $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date)->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                        $selected_claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {
                        $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date)->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                        $selected_claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {
                        $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                        $selected_claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {
                        $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                        $selected_claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {
                        $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                        $selected_claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {
                        $claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);
                        $claim_count->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                        $selected_claim_data->where(DB::raw('DATE(import_fields.billed_submit_date)'), '>=', $bill_start_date)->where(DB::raw('DATE(import_fields.billed_submit_date)'), '<=', $bill_end_date);
                    }
                }

                if (!empty($search_payer_name)) {
                    if ($sort_data == null && $sort_type == null) {
                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%')->offset($skip)->limit($end);
                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%')->offset($skip)->limit($end);
                        $claim_count->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%')->offset($skip)->limit($end);
                        $claim_count->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {
                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%')->offset($skip)->limit($end);
                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%')->offset($skip)->limit($end);
                        $claim_count->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%')->offset($skip)->limit($end);
                        $claim_count->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                    }

                    if ($sort_data == true && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {
                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);
                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);
                        $claim_count->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);
                        $claim_count->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                    } else if ($sort_data == false && $search == 'search' && $sort_data != null && $sort_type != 'null' && $sort_type != null) {
                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);
                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);
                        $claim_count->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);
                        $claim_count->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                    }

                    if ($sorting_method == true && $sort_data == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {
                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);
                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);
                        $claim_count->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);
                        $claim_count->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                    } else if ($sorting_method == false && $sort_data == null && $search == 'search' && !empty($sorting_name)) {
                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);
                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);
                        $claim_count->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('sec_ins_name', 'LIKE', '%' . $search_payer_name . '%');

                        $claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);
                        $claim_count->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                        $selected_claim_data->orWhere('ter_ins_name', 'LIKE', '%' . $search_payer_name . '%');
                    }
                }

                $claim_data = $claim_data->get();
                foreach ($claim_data as $key => $claim_datas) {
                    $getStatusCode = Statuscode::where('id', $claim_datas['status_code'])->first();
                    $claim_data[$key]['statuscode'] = $getStatusCode->status_code ? $getStatusCode->status_code : 'NA';

                    $getSubStatusCode = Sub_statuscode::where('id', $claim_datas['substatus_code'])->first();
                    $claim_data[$key]['substatuscode'] = $getSubStatusCode->status_code ? $getSubStatusCode->status_code : 'NA';
                }

                $current_total = $claim_data->count();

                $claim_count = $claim_count->count();

                $selected_claim_data = $selected_claim_data->get();

                $selected_count = $selected_claim_data->count();

                $type = 'wo';
            }



            //$claim_count=sizeof($claim_data);


            // $claim_data= Import_field::where('status_code',$status_code[0]['id'])->orderBy('id', 'asc')-> offset($skip) ->limit($end)->get();
            // $claim_count= Import_field::where('status_code',$status_code[0]['id'])->count();
        } else {
            $claims = Action::where('assigned_to', $user_id)->where('status', 'Active')->distinct('claim_id')->pluck('claim_id');
            // $claim_count=Action::where('assigned_to', $user_id)->distinct('claim_id')->pluck('claim_id');
            // $claim_count=sizeof($claim_count);
            $claim_data = Import_field::whereIN('claim_no', $claims)->offset($skip)->limit($end)->get();
            foreach ($claim_data as $key => $claim_datas) {
                $getStatusCode = Statuscode::where('id', $claim_datas['status_code'])->first();
                $claim_data[$key]['statuscode'] = $getStatusCode->status_code ? $getStatusCode->status_code : 'NA';

                $getSubStatusCode = Sub_statuscode::where('id', $claim_datas['substatus_code'])->first();
                $claim_data[$key]['substatuscode'] = $getSubStatusCode->status_code ? $getSubStatusCode->status_code : 'NA';
            }
            $claim_count = Import_field::whereIN('claim_no', $claims)->count();
            // $claim_data=Import_field::where('assigned_to', $user_id)->where('status_code',$status_code[0]['id'])->orderBy('id', 'desc')-> offset($skip) ->limit($end)->get();
            // $claim_count=Import_field::where('assigned_to', $user_id)->where('status_code',$status_code[0]['id'])->count();
        }

        // foreach($claim_data as $key=>$claim)
        // {

        //     $dob=$claim_data[$key]['dos'];
        //     //   $dob = strtotime($dob);
        //       $from= DateTime::createFromFormat('m/d/Y', date('m/d/Y',strtotime($dob)));

        //        $to= date('d/m/Y');
        //     $to= new DateTime;
        //       $age = $to->diff($from);

        //       $claim_data[$key]['claim_age']=$age->days;


        //     if($claim['substatus_code']!= null)
        //     {
        //         $substatus=Sub_statuscode::where('id', $claim['substatus_code'])->get();
        //         $claim_data[$key]['sub_status']=$substatus[0]['description'];
        //     }
        //     else{
        //         $claim_data[$key]['sub_status']='NA';
        //     }
        //     if($claim['ca_work_order'] == Null )
        //     {
        //         $assigned_to= 'NA';
        //         $assigned_by= 'NA';
        //     }
        //     else{

        //         $assigned_data=Workorder_field::where('id', $claim['ca_work_order'])->get();
        //         $assigned_to= User::where('id', $claim['assigned_to'])->pluck('firstname');
        //         $assigned_by= User::where('id', $assigned_data[0]['created_by'])->pluck('firstname');
        //     }


        //     $claim_data[$key]['assigned_to_name']=$assigned_to;
        //     $claim_data[$key]['assigned_by_name']=$assigned_by;

        //     // $claim_data[$key]['followup_date'] = date('m/d/Y', strtotime( $claim_data[$key]['followup_date']));


        //     $date_format[0]=(int)date('d', strtotime( $claim_data[$key]['followup_date']));
        //     $date_format[1]=(int)date('m', strtotime( $claim_data[$key]['followup_date']));
        //     $date_format[2]=(int)date('Y', strtotime( $claim_data[$key]['followup_date']));

        //     $claim_data[$key]['followup_date'] = $date_format;

        //     $claim_data[$key]['touch']=Claim_note::where('claim_id', $claim_data[$key]['claim_no']) ->count();

        //     // $claim_data[$key]['touch']=Claim_note::where('claim_id', $claim['claim_no']) ->count();
        // }

        foreach ($claim_data as $key => $value) {

            $claim_data[$key]['created_ats'] = date('m/d/Y', strtotime($claim_data[$key]['created_ats']));

            // $dos = strtotime($claim_data[$key]['dos']);

            // if (!empty($dos) && $dos != 0000 - 00 - 00) {
            //   $claim_data[$key]['dos'] = date('m-d-Y', $dos);
            // }

            // if ($dos == 0000 - 00 - 00) {
            //   $claim_data[$key]['dos'] = 01 - 01 - 1970;
            // }

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



                // $date_format[0]=(int)date('d', strtotime( $claim_data[$key]['followup_date']));
                // $date_format[1]=(int)date('m', strtotime( $claim_data[$key]['followup_date']));
                // $date_format[2]=(int)date('Y', strtotime( $claim_data[$key]['followup_date']));

                // $claim_data[$key]['followup_date'] = $date_format;

                $date_formats = Carbon::parse($value['followup_date'])->format('m/d/Y');

                $claim_data[$key]['follows_date'] = $date_formats;
            }
        }

        return response()->json([
            'data'  => $claim_data,
            'count' => $claim_count,
            'current_total' => $current_total,
            'skip' => $skip,
            'type' => $type,
            'selected_claim_data' => $selected_claim_data,
        ]);
    }

    public function get_user_list(LoginRequest $request)
    {
        $user_id = $request->get('user_id');
        $users = User::where('role_id', 6)->select('id', 'firstname', 'lastname')->get();
        $i = 0;
        foreach ($users as $user) {
            $claim_count = Import_field::where('assigned_to', $user['id'])->where('claim_Status', 'CA Assigned')->count();
            $users[$i]['assigned_nos'] = $claim_count;
            $assign_limit = User_work_profile::where('user_id', $user['id'])->pluck('claim_assign_limit');
            $users[$i]['assigned_claims'] = $claim_count;
            $users[$i]['assign_limit'] = $assign_limit[0];
            $i++;
        }

        return response()->json([
            'data' => $users
        ]);
    }

    // public function create_ca_workorder(LoginRequest $request)
    // {
    //     $user_id=$request->get('filter');
    //     $workorder_det=$request->get('assign_data');
    //     $claim_data=[];
    //     $i=1;
    //     foreach($workorder_det as $detail)
    //     {
    //         $client=$detail['client_id'];
    //         $claims=$detail['claims'];
    //         foreach($claims as $claim)
    //         {
    //             $update_claim =DB::table('import_fields')->where('claim_no',$claim)->update(array(
    //                 'claim_Status'          => "CA Assigned",
    //                 'assigned_to'           =>  $client
    //                 ));
    //                 $claim_data[$i] = ["claim_no" => $claim, "state" => 7, "assigned_by" => $user_id, "assigned_to" => $client];
    //                 $i++;
    //                 }
    //                 }
    //                 $data= Record_claim_history::create_history($claim_data);
    //                  return response()->json([
    //                      'data' => $workorder_det,
    //                      'upld' => $data
    //                      ]);
    //                      }

    public function fetch_export_data(LoginRequest $request)
    {

        $filter = $request->get('filter');
        $status_code = $request->get('status');
        $user_id = $request->get('user');


        /*The Values of User role and status code must be changed */

        $status_code = Statuscode::where('description', 'like', '%' . 'Client Assistance' . '%')->get();

        $user_role = User::where('id', $user_id)->pluck('role_id');
        if ($user_role[0] == 5 || $user_role[0] == 3 || $user_role[0] == 2) {
            $claim_data = Import_field::where('status_code', $status_code[0]['id'])->orderBy('id', 'asc')->get();
        } else {
            $claim_data = Import_field::where('assigned_to', $user_id)->where('status_code', $status_code[0]['id'])->orderBy('id', 'desc')->get();
        }

        foreach ($claim_data as $key => $claim) {
            $dob = $claim_data[$key]['created_at'];
            // $claim_age = Carbon::parse($dob)->age;
            $claim_age = $dob->diff(Carbon::now())->format('%d');
            $claim_data[$key]['claim_age'] = $claim_age;
            $substatus = Sub_statuscode::where('id', $claim['substatus_code'])->get();
            $claim_data[$key]['sub_status'] = $substatus[0]['description'];

            $assigned_to = User::where('id', $claim['assigned_to'])->pluck('firstname');
            $assigned_by = User::where('id', $claim['assigned_by'])->pluck('firstname');
            $claim_data[$key]['assigned_to_name'] = $assigned_to;
            $claim_data[$key]['assigned_by_name'] = $assigned_by;

            $claim_data[$key]['touch'] = Claim_note::where('claim_id', $claim['claim_no'])->count();
        }

        return response()->json([
            'data'  => $claim_data
        ]);
    }

    public function get_ca_payer_name(LoginRequest $request)
    {
        try {
            // DB::enableQueryLog();
            $prim_ins_name = Import_field::leftJoin('claim_notes', 'claim_notes.claim_id', '=', 'import_fields.claim_no')
                ->leftJoin('claim_histories', 'claim_histories.claim_id', '=', 'import_fields.claim_no')
                ->leftJoin('qc_notes', 'qc_notes.claim_id', '=', 'import_fields.claim_no')
                ->where('qc_notes.error_type', '=', '[1]')
                ->where('import_fields.claim_Status', 'Client Assistance')
                ->distinct('claim_histories.claim_no')
                ->where('prim_ins_name', '<>', NULL)
                ->pluck('prim_ins_name')->toArray();
            $sec_ins_name = Import_field::leftJoin('claim_notes', 'claim_notes.claim_id', '=', 'import_fields.claim_no')
                ->leftJoin('claim_histories', 'claim_histories.claim_id', '=', 'import_fields.claim_no')
                ->leftJoin('qc_notes', 'qc_notes.claim_id', '=', 'import_fields.claim_no')
                ->where('qc_notes.error_type', '=', '[1]')
                ->where('import_fields.claim_Status', 'Client Assistance')
                ->distinct('claim_histories.claim_no')
                ->where('sec_ins_name', '<>', NULL)
                ->pluck('sec_ins_name')->toArray();
            $ter_ins_name = Import_field::leftJoin('claim_notes', 'claim_notes.claim_id', '=', 'import_fields.claim_no')
                ->leftJoin('claim_histories', 'claim_histories.claim_id', '=', 'import_fields.claim_no')
                ->leftJoin('qc_notes', 'qc_notes.claim_id', '=', 'import_fields.claim_no')
                ->where('qc_notes.error_type', '=', '[1]')
                ->where('import_fields.claim_Status', 'Client Assistance')
                ->distinct('claim_histories.claim_no')
                ->where('ter_ins_name', '<>', NULL)
                ->pluck('ter_ins_name')->toArray();

            // $query = DB::getQueryLog();
            // dd($query);
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
}
