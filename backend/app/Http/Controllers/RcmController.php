<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\Action;
use App\Models\Claim_history;
use App\Models\Claim_note;
use App\Models\Import_field;
use App\Models\Statuscode;
use App\Models\Sub_statuscode;
use App\Models\User;
use App\Models\User_work_profile;
use App\Models\Workorder_field;
use Carbon\Carbon;
use DateTime;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RcmController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['get_rcm_claims', 'get_rcm_team_list', 'create_rcm_workorder', 'fetch_export_data', 'get_rcm_claims_sorting']]);
    }


    public function get_rcm_claims(LoginRequest $request)
    {
        $user_id = $request->get('user_id');
        $page_no = $request->get('page_no');
        $page_count = $request->get('count');
        $sort_type = $request->get('sort_type');
        //dd($sort_type); //claim_no
        $sort_filter = $request->get('sort_data');
        //dd($sort_filter); //true
        $sorting_method = $request->get('sorting_method');
        $sorting_name = $request->get('sorting_name');
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
        }
        $search = $request->get('search');

        $total_count = 0;
        $skip = ($page_no - 1) * $page_count;
        $end = $page_count;

        /*The Values of User role and status code must be changed */

        $status_code = Statuscode::where('description', 'like', '%' . 'RCM Team' . '%')->get();

        $user_role = User::where('id', $user_id)->pluck('role_id');
        if ($user_role[0] == 5 || $user_role[0] == 3 || $user_role[0] == 2) {

            $users = User::where('role_id', '7')->orWhere('role_id', '3')->pluck('id');

            $claims = Claim_history::where('claim_state', '8')->distinct('claim_id')->pluck('claim_id');

            $claim_count = Action::whereIN('assigned_to', $users)->distinct('claim_id')->pluck('claim_id');
            $claim_count = sizeof($claim_count);
            // $claim_data= Import_field::whereIN('claim_no',$claims)->get();

            // dd($searchValue);
            if ($searchValue == null) {
                if ($sort_type == null && $sorting_name == 'null') {
                    $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                    claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                  AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                        $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                    })->leftjoin(DB::raw("(SELECT
                      claim_histories.claim_id,claim_histories.created_at as created_ats
                    FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                    ) as claim_histories"), function ($join) {
                        $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                    })->whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->offset($skip)->limit($end)->distinct('claim_no')->get();
                } else if ($sort_type == 'null' && empty($sorting_name)) {
                    $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                    claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                  AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                        $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                    })->leftjoin(DB::raw("(SELECT
                      claim_histories.claim_id,claim_histories.created_at as created_ats
                    FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                    ) as claim_histories"), function ($join) {
                        $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                    })->whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->offset($skip)->limit($end)->distinct('claim_no')->get();
                } else if (empty($sort_type) && empty($sorting_name) && !empty($sorting_method)) {
                    $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                    claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                  AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                        $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                    })->leftjoin(DB::raw("(SELECT
                      claim_histories.claim_id,claim_histories.created_at as created_ats
                    FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                    ) as claim_histories"), function ($join) {
                        $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                    })->whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->offset($skip)->limit($end)->distinct('claim_no')->get();
                }/*else if($sort_type == null &&  $sorting_name == 'null'){
                dd('third');
                $claim_data= Import_field::leftjoin(DB::raw("(SELECT
                    claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                  AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function($join) { $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->whereIN('claim_no',$claims)->where('claim_Status','RCM Team')-> offset($skip) ->limit($end)->  distinct('claim_no')->get();
              }*/ else if ($sorting_name != 'null' && empty($sort_type)) {
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
                        })->whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end)->distinct('claim_no')->get();
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
                        })->whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end)->distinct('claim_no')->get();
                    }
                } else if ($sort_type != 'null' && $sorting_name == 'null') {
                    if ($sort_filter == true) {
                        $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                    claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                  AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                        })->leftjoin(DB::raw("(SELECT
                      claim_histories.claim_id,claim_histories.created_at as created_ats
                    FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                    ) as claim_histories"), function ($join) {
                            $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                        })->whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy($sort_type, 'desc')->offset($skip)->limit($end)->distinct('claim_no')->get();
                    } else if ($sort_filter == false) {
                        $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                    claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                  AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                        })->leftjoin(DB::raw("(SELECT
                      claim_histories.claim_id,claim_histories.created_at as created_ats
                    FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                    ) as claim_histories"), function ($join) {
                            $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                        })->whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy($sort_type, 'asc')->offset($skip)->limit($end)->distinct('claim_no')->get();
                    }
                }

                $current_total = $claim_data->count();
                //dd($claim_data);
                //$claim_count=sizeof($claim_data);

                $selected_claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->distinct('claim_no')->get();

                //   $claim_data= Import_field::where('status_code',$status_code[0]['id'])->orderBy('id', 'asc')-> offset($skip) ->limit($end)->get();
                $claim_count = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->distinct('claim_no')->count();
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
                })->whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team');

                $claim_count = Import_field::leftjoin(DB::raw("(SELECT
                    claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                  AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
                      claim_histories.claim_id,claim_histories.created_at as created_ats
                    FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                    ) as claim_histories"), function ($join) {
                    $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                })->whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team');

                $selected_claim_data = Import_field::leftjoin(DB::raw("(SELECT
                    claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
                  AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
                      claim_histories.claim_id,claim_histories.created_at as created_ats
                    FROM claim_histories WHERE claim_histories.id IN (SELECT MAX(id) FROM claim_histories GROUP BY claim_histories.claim_id) GROUP BY claim_histories.claim_id
                    ) as claim_histories"), function ($join) {
                    $join->on('claim_histories.claim_id', '=', 'import_fields.claim_no');
                })->whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team');

                //$sort_type= $request->get('sort_type');
                //dd($sort_type); //claim_no
                //$sort_filter= $request->get('sort_data');
                //dd($sort_filter); //true

                if (!empty($search_claim_no)) {

                    if ($sort_filter == null && $sort_type == null) {

                        $claim_data->where('claim_no', $search_claim_no)->offset($skip)->limit($end);

                        $claim_count->where('claim_no', $search_claim_no);

                        $selected_claim_data->where('claim_no', $search_claim_no);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('claim_no', $search_claim_no)->offset($skip)->limit($end);


                        $claim_count->where('claim_no', $search_claim_no);

                        $selected_claim_data->where('claim_no', $search_claim_no);
                    }

                    if ($sort_filter == true && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('claim_no', $search_claim_no)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('claim_no', $search_claim_no);

                        $selected_claim_data->where('claim_no', $search_claim_no);
                    } else if ($sort_filter == false && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('claim_no', $search_claim_no)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('claim_no', $search_claim_no);

                        $selected_claim_data->where('claim_no', $search_claim_no);
                    }

                    if ($sorting_method == true && $sort_filter == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('claim_no', $search_claim_no)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('claim_no', $search_claim_no);

                        $selected_claim_data->where('claim_no', $search_claim_no);
                    } else if ($sorting_method == false && $sort_filter == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('claim_no', $search_claim_no)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('claim_no', $search_claim_no);

                        $selected_claim_data->where('claim_no', $search_claim_no);
                    }
                }

                if (!empty($search_acc_no)) {

                    if ($sort_filter == null && $sort_type == null) {

                        $claim_data->where('acct_no', $search_acc_no)->offset($skip)->limit($end);

                        $claim_count->where('acct_no', $search_acc_no);

                        $selected_claim_data->where('acct_no', $search_acc_no);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('acct_no', $search_acc_no)->offset($skip)->limit($end);


                        $claim_count->where('acct_no', $search_acc_no);

                        $selected_claim_data->where('acct_no', $search_acc_no);
                    }

                    if ($sort_filter == true && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('acct_no', $search_acc_no)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('acct_no', $search_acc_no);

                        $selected_claim_data->where('acct_no', $search_acc_no);
                    } else if ($sort_filter == false && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('acct_no', $search_acc_no)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('acct_no', $search_acc_no);

                        $selected_claim_data->where('acct_no', $search_acc_no);
                    }

                    if ($sorting_method == true && $sort_filter == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('acct_no', $search_acc_no)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('acc', $search_acc_no);

                        $selected_claim_data->where('acct_no', $search_acc_no);
                    } else if ($sorting_method == false && $sort_filter == null && $search == 'search' && !empty($sorting_name)) {

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

                    if ($sort_filter == null && $sort_type == null) {

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->offset($skip)->limit($end);

                        $claim_count->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);

                        $selected_claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->offset($skip)->limit($end);


                        $claim_count->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);

                        $selected_claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    }

                    if ($sort_filter == true && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);

                        $selected_claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    } else if ($sort_filter == false && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);

                        $selected_claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    }

                    if ($sorting_method == true && $sort_filter == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);

                        $selected_claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    } else if ($sorting_method == false && $sort_filter == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);

                        $selected_claim_data->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_sart_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
                    }
                }

                if (!empty($search_patient_name)) {

                    if ($sort_filter == null && $sort_type == null) {

                        $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');

                        $selected_claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%')->offset($skip)->limit($end);


                        $claim_count->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');

                        $selected_claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                    }

                    if ($sort_filter == true && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');

                        $selected_claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                    } else if ($sort_filter == false && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');

                        $selected_claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                    }

                    if ($sorting_method == true && $sort_filter == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');

                        $selected_claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                    } else if ($sorting_method == false && $sort_filter == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');

                        $selected_claim_data->where('patient_name', 'LIKE', '%' . $search_patient_name . '%');
                    }
                }

                if (!empty($search_total_charge)) {

                    if ($sort_filter == null && $sort_type == null) {

                        $claim_data->where('total_charges', '=', $search_total_charge)->offset($skip)->limit($end);

                        $claim_count->where('total_charges', '=', $search_total_charge);

                        $selected_claim_data->where('total_charges', '=', $search_total_charge);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('total_charges', '=', $search_total_charge)->offset($skip)->limit($end);


                        $claim_count->where('total_charges', '=', $search_total_charge);

                        $selected_claim_data->where('total_charges', '=', $search_total_charge);
                    }

                    if ($sort_filter == true && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('total_charges', '=', $search_total_charge)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('total_charges', '=', $search_total_charge);

                        $selected_claim_data->where('total_charges', '=', $search_total_charge);
                    } else if ($sort_filter == false && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('total_charges', '=', $search_total_charge)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('total_charges', '=', $search_total_charge);

                        $selected_claim_data->where('total_charges', '=', $search_total_charge);
                    }

                    if ($sorting_method == true && $sort_filter == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('total_charges', '=', $search_total_charge)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('total_charges', '=', $search_total_charge);

                        $selected_claim_data->where('total_charges', '=', $search_total_charge);
                    } else if ($sorting_method == false && $sort_filter == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('total_charges', '=', $search_total_charge)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('total_charges', '=', $search_total_charge);

                        $selected_claim_data->where('total_charges', '=', $search_total_charge);
                    }
                }

                if (!empty($search_total_ar)) {

                    if ($sort_filter == null && $sort_type == null) {

                        $claim_data->where('total_ar', '=', $search_total_ar)->offset($skip)->limit($end);

                        $claim_count->where('total_ar', '=', $search_total_ar);

                        $selected_claim_data->where('total_ar', '=', $search_total_ar);
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('total_ar', '=', $search_total_ar)->offset($skip)->limit($end);


                        $claim_count->where('total_ar', '=', $search_total_ar);

                        $selected_claim_data->where('total_ar', '=', $search_total_ar);
                    }

                    if ($sort_filter == true && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('total_ar', '=', $search_total_ar)->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('total_ar', '=', $search_total_ar);

                        $selected_claim_data->where('total_ar', '=', $search_total_ar);
                    } else if ($sort_filter == false && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('total_ar', '=', $search_total_ar)->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('total_ar', '=', $search_total_ar);

                        $selected_claim_data->where('total_ar', '=', $search_total_ar);
                    }

                    if ($sorting_method == true && $sort_filter == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('total_ar', '=', $search_total_ar)->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('total_ar', '=', $search_total_ar);

                        $selected_claim_data->where('total_ar', '=', $search_total_ar);
                    } else if ($sorting_method == false && $sort_filter == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('total_ar', '=', $search_total_ar)->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('total_ar', '=', $search_total_ar);

                        $selected_claim_data->where('total_ar', '=', $search_total_ar);
                    }
                }

                if (!empty($search_claim_note)) {

                    if ($sort_filter == null && $sort_type == null) {

                        $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%')->offset($skip)->limit($end);

                        $claim_count->where('claim_note', 'LIKE', '%' . $search_claim_note . '%');

                        $selected_claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%')->offset($skip)->limit($end);


                        $claim_count->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');

                        $selected_claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                    }

                    if ($sort_filter == true && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');

                        $selected_claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                    } else if ($sort_filter == false && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');

                        $selected_claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                    }

                    if ($sorting_method == true && $sort_filter == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');

                        $selected_claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                    } else if ($sorting_method == false && $sort_filter == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');

                        $selected_claim_data->where('claims_notes', 'LIKE', '%' . $search_claim_note . '%');
                    }
                }

                // if(!empty($search_insurance)){

                //   if($sort_filter == null && $sort_type == null){

                //     $claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%')-> offset($skip) ->limit($end);

                //     $claim_count->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                //     $selected_claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%');
                //   }

                //   if($sort_type != 'null' && $sort_type == null && empty($sorting_name)){

                //     $claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%')-> offset($skip) ->limit($end);


                //     $claim_count->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                //     $selected_claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%');
                //   }

                //   if($sort_filter == true && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null){

                //     $claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%')->orderBy($sort_type, 'asc')-> offset($skip) ->limit($end);

                //     $claim_count->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                //     $selected_claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                //   }else if($sort_filter == false && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null){

                //       $claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%')->orderBy($sort_type, 'desc')-> offset($skip) ->limit($end);

                //       $claim_count->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                //       $selected_claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%');
                //   }

                //   if($sorting_method == true && $sort_filter == null && $search == 'search' && $sort_type == null && !empty($sorting_name)){

                //       $claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%')->orderBy($sorting_name, 'asc')-> offset($skip) ->limit($end);

                //       $claim_count->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                //       $selected_claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                //   }else if($sorting_method == false && $sort_filter == null && $search == 'search' && !empty($sorting_name)){

                //       $claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%')->orderBy($sorting_name, 'desc')-> offset($skip) ->limit($end);

                //       $claim_count->where('insurance', 'LIKE', '%' . $search_insurance . '%');

                //       $selected_claim_data->where('insurance', 'LIKE', '%' . $search_insurance . '%');
                //   }

                // }

                if (!empty($search_prim_ins_name)) {

                    if ($sort_filter == null && $sort_type == null) {

                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');

                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%')->offset($skip)->limit($end);


                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');

                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                    }

                    if ($sort_filter == true && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');

                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                    } else if ($sort_filter == false && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');

                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                    }

                    if ($sorting_method == true && $sort_filter == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');

                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                    } else if ($sorting_method == false && $sort_filter == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');

                        $selected_claim_data->where('prim_ins_name', 'LIKE', '%' . $search_prim_ins_name . '%');
                    }
                }

                if (!empty($search_prim_pol_id)) {

                    if ($sort_filter == null && $sort_type == null) {

                        $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%')->offset($skip)->limit($end);

                        $claim_count->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');

                        $selected_claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%')->offset($skip)->limit($end);


                        $claim_count->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');

                        $selected_claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                    }

                    if ($sort_filter == true && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');

                        $selected_claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                    } else if ($sort_filter == false && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');

                        $selected_claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                    }

                    if ($sorting_method == true && $sort_filter == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');

                        $selected_claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                    } else if ($sorting_method == false && $sort_filter == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');

                        $selected_claim_data->where('prim_pol_id', 'LIKE', '%' . $search_prim_pol_id . '%');
                    }
                }

                if (!empty($search_sec_ins_name)) {

                    if ($sort_filter == null && $sort_type == null) {

                        $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');

                        $selected_claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%')->offset($skip)->limit($end);


                        $claim_count->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');

                        $selected_claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                    }

                    if ($sort_filter == true && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');

                        $selected_claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                    } else if ($sort_filter == false && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');

                        $selected_claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                    }

                    if ($sorting_method == true && $sort_filter == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');

                        $selected_claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                    } else if ($sorting_method == false && $sort_filter == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');

                        $selected_claim_data->where('sec_ins_name', 'LIKE', '%' . $search_sec_ins_name . '%');
                    }
                }

                if (!empty($search_sec_pol_id)) {

                    if ($sort_filter == null && $sort_type == null) {

                        $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%')->offset($skip)->limit($end);

                        $claim_count->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');

                        $selected_claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%')->offset($skip)->limit($end);


                        $claim_count->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');

                        $selected_claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                    }

                    if ($sort_filter == true && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');

                        $selected_claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                    } else if ($sort_filter == false && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');

                        $selected_claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                    }

                    if ($sorting_method == true && $sort_filter == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');

                        $selected_claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                    } else if ($sorting_method == false && $sort_filter == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');

                        $selected_claim_data->where('sec_pol_id', 'LIKE', '%' . $search_sec_pol_id . '%');
                    }
                }

                if (!empty($search_ter_ins_name)) {

                    if ($sort_filter == null && $sort_type == null) {

                        $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%')->offset($skip)->limit($end);

                        $claim_count->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');

                        $selected_claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%')->offset($skip)->limit($end);


                        $claim_count->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');

                        $selected_claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                    }

                    if ($sort_filter == true && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');

                        $selected_claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                    } else if ($sort_filter == false && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');

                        $selected_claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                    }

                    if ($sorting_method == true && $sort_filter == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');

                        $selected_claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                    } else if ($sorting_method == false && $sort_filter == null && $search == 'search' && !empty($sorting_name)) {

                        $claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%')->orderBy($sorting_name, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');

                        $selected_claim_data->where('ter_ins_name', 'LIKE', '%' . $search_ter_ins_name . '%');
                    }
                }

                if (!empty($search_ter_pol_id)) {

                    if ($sort_filter == null && $sort_type == null) {

                        $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%')->offset($skip)->limit($end);

                        $claim_count->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');

                        $selected_claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                    }

                    if ($sort_type != 'null' && $sort_type == null && empty($sorting_name)) {

                        $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%')->offset($skip)->limit($end);


                        $claim_count->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');

                        $selected_claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                    }

                    if ($sort_filter == true && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%')->orderBy($sort_type, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');

                        $selected_claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                    } else if ($sort_filter == false && $search == 'search' && $sort_filter != null && $sort_type != 'null' && $sort_type != null) {

                        $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%')->orderBy($sort_type, 'desc')->offset($skip)->limit($end);

                        $claim_count->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');

                        $selected_claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                    }

                    if ($sorting_method == true && $sort_filter == null && $search == 'search' && $sort_type == null && !empty($sorting_name)) {

                        $claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%')->orderBy($sorting_name, 'asc')->offset($skip)->limit($end);

                        $claim_count->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');

                        $selected_claim_data->where('ter_pol_id', 'LIKE', '%' . $search_ter_pol_id . '%');
                    } else if ($sorting_method == false && $sort_filter == null && $search == 'search' && !empty($sorting_name)) {

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

                $claim_data = $claim_data->get();

                $current_total = $claim_data->count();

                $claim_count = $claim_count->count();

                $selected_claim_data = $selected_claim_data->get();

                $selected_count = $selected_claim_data->count();
            }
        } else {
            $claims = Claim_history::where('claim_state', '9')->distinct('claim_id')->offset($skip)->limit($end)->pluck('claim_id');
            //$claims= Action::where('assigned_to',$user_id)->where('status','Active')->distinct('claim_id')-> offset($skip) ->limit($end)->pluck('claim_id');
            $claim_count = Action::where('assigned_to', $user_id)->distinct('claim_id')->pluck('claim_id');
            $claim_count = sizeof($claim_count);
            $claim_data = Import_field::whereIN('claim_no', $claims)->get();
            $current_total = $claim_data->count();
        }

        // foreach($claim_data as $key=>$claim)
        // {
        //     $dob=$claim_data[$key]['created_at'];
        //     // $claim_age = Carbon::parse($dob)->age;
        //     $claim_age =$dob->diff(Carbon::now())->format('%d');
        //     $claim_data[$key]['claim_age']=$claim_age;

        //     if($claim['substatus_code'] != NULL)
        //     {
        //       $substatus=Sub_statuscode::where('id', $claim['substatus_code'])->get();
        //       $claim_data[$key]['sub_status']=$substatus[0]['description'];

        //     }
        //     else
        //     {
        //       $claim_data[$key]['sub_status']=0;
        //     }

        //     //dd($claim['claim_Status']);

        //     if($claim['rcm_work_order'] == NULL )
        //     {
        //         $assigned_to= 'NA';
        //         $assigned_by= 'NA';
        //     }
        //     else{

        //         $assigned_data=Workorder_field::where('id', $claim['rcm_work_order'])->get();


        //         $assigned_to= User::where('id', $claim['assigned_to'])->pluck('firstname');
        //         $assigned_by= User::where('id', $assigned_data[0]['created_by'])->pluck('firstname');
        //     }


        //     $claim_data[$key]['assigned_to_name']=$assigned_to;
        //     $claim_data[$key]['assigned_by_name']=$assigned_by;

        //     $claim_data[$key]['touch']=Claim_note::where('claim_id', $claim['claim_no']) ->count();
        // }

        foreach ($claim_data as $key => $value) {


            $claim_data[$key]['created_ats'] = date('m/d/Y', strtotime($claim_data[$key]['created_ats']));

            $dos = strtotime($claim_data[$key]['dos']);

            if (!empty($dos) && $dos != 0000 - 00 - 00) {
                $claim_data[$key]['dos'] = date('m-d-Y', $dos);
            }

            if ($dos == 0000 - 00 - 00) {
                $claim_data[$key]['dos'] = 01 - 01 - 1970;
            }

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

        $op_data['datas'] = $claim_data;

        return response()->json([
            'data'  => $claim_data,
            'count' => $claim_count,
            'current_total' => $current_total,
            'skip' => $skip,
            'selected_claim_data' => $selected_claim_data,
        ]);
    }

    public function get_rcm_team_list(LoginRequest $request)
    {
        $user_id = $request->get('user_id');
        $users = User::where('role_id', 7)->select('id', 'firstname', 'lastname')->get();
        $i = 0;
        foreach ($users as $user) {
            $claim_count = Import_field::where('assigned_to', $user['id'])->where('claim_Status', 'RCM Assigned')->count();
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




    public function fetch_export_data(LoginRequest $request)
    {

        $filter = $request->get('filter');
        $status_code = $request->get('status');
        $user_id = $request->get('user');


        /*The Values of User role and status code must be changed */

        $status_code = Statuscode::where('description', 'like', '%' . 'RCM Team' . '%')->get();

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

    function get_rcm_claims_sorting(LoginRequest $request)
    {

        $user_id = $request->get('user_id');
        $page_no = $request->get('page_no');
        $page_count = $request->get('count');
        $sort_type = $request->get('type');
        $sort_filter = $request->get('filter');
        $total_count = 0;
        $skip = ($page_no - 1) * $page_count;
        $end = $page_count;

        /*The Values of User role and status code must be changed */

        $status_code = Statuscode::where('description', 'like', '%' . 'RCM Team' . '%')->get();

        $user_role = User::where('id', $user_id)->pluck('role_id');
        if ($user_role[0] == 5 || $user_role[0] == 3 || $user_role[0] == 2) {

            $users = User::where('role_id', '7')->orWhere('role_id', '3')->pluck('id');

            $claims = Claim_history::where('claim_state', '8')->distinct('claim_id')->pluck('claim_id');
            //$claims=Action::whereIN('assigned_to', $users)->distinct('claim_id')-> offset($skip) ->limit($end)->pluck('claim_id');
            $claim_count = Action::whereIN('assigned_to', $users)->distinct('claim_id')->pluck('claim_id');
            $claim_count = sizeof($claim_count);
            // $claim_data= Import_field::whereIN('claim_no',$claims)->get();

            if ($sort_type == 'claim_no') {
                if ($sort_filter == true) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('claim_no', 'desc')->distinct('claim_no')->get();
                } else if ($sort_filter == false) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('claim_no', 'asc')->distinct('claim_no')->get();
                }
            } else if ($sort_type == 'dos') {
                if ($sort_filter == true) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('dos', 'desc')->distinct('claim_no')->get();
                } else if ($sort_filter == false) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('dos', 'asc')->distinct('claim_no')->get();
                }
            } else if ($sort_type == 'acct_no') {
                if ($sort_filter == true) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('acct_no', 'desc')->distinct('claim_no')->get();
                } else if ($sort_filter == false) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('acct_no', 'asc')->distinct('claim_no')->get();
                }
            } else if ($sort_type == 'patient_name') {
                if ($sort_filter == true) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('patient_name', 'desc')->distinct('claim_no')->get();
                } else if ($sort_filter == false) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('patient_name', 'asc')->distinct('claim_no')->get();
                }
            } else if ($sort_type == 'rendering_prov') {
                if ($sort_filter == true) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('rendering_prov', 'desc')->distinct('claim_no')->get();
                } else if ($sort_filter == false) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('rendering_prov', 'asc')->distinct('claim_no')->get();
                }
            } else if ($sort_type == 'responsibility') {
                if ($sort_filter == true) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('responsibility', 'desc')->distinct('claim_no')->get();
                } else if ($sort_filter == false) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('responsibility', 'asc')->distinct('claim_no')->get();
                }
            } else if ($sort_type == 'prim_ins_name') {
                if ($sort_filter == true) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('prim_ins_name', 'desc')->distinct('claim_no')->get();
                } else if ($sort_filter == false) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('prim_ins_name', 'asc')->distinct('claim_no')->get();
                }
            } else if ($sort_type == 'sec_ins_name') {
                if ($sort_filter == true) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('sec_ins_name', 'desc')->distinct('claim_no')->get();
                } else if ($sort_filter == false) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('sec_ins_name', 'asc')->distinct('claim_no')->get();
                }
            } else if ($sort_type == 'ter_ins_name') {
                if ($sort_filter == true) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('ter_ins_name', 'desc')->distinct('claim_no')->get();
                } else if ($sort_filter == false) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('ter_ins_name', 'asc')->distinct('claim_no')->get();
                }
            } else if ($sort_type == 'total_charges') {
                if ($sort_filter == true) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('total_charges', 'desc')->distinct('claim_no')->get();
                } else if ($sort_filter == false) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('total_charges', 'asc')->distinct('claim_no')->get();
                }
            } else if ($sort_type == 'total_ar') {
                if ($sort_filter == true) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('total_ar', 'desc')->distinct('claim_no')->get();
                } else if ($sort_filter == false) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('total_ar', 'asc')->distinct('claim_no')->get();
                }
            } else if ($sort_type == 'claim_Status') {
                if ($sort_filter == true) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('claim_Status', 'desc')->distinct('claim_no')->get();
                } else if ($sort_filter == false) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('claim_Status', 'asc')->distinct('claim_no')->get();
                }
            } else if ($sort_type == 'claim_note') {
                if ($sort_filter == true) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('claim_note', 'desc')->distinct('claim_no')->get();
                } else if ($sort_filter == false) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('claim_note', 'asc')->distinct('claim_no')->get();
                }
            } else if ($sort_type == 'assigned_to') {
                if ($sort_filter == true) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('assigned_to', 'desc')->distinct('claim_no')->get();
                } else if ($sort_filter == false) {
                    $claim_data = Import_field::whereIN('claim_no', $claims)->where('claim_Status', 'RCM Team')->orderBy('assigned_to', 'asc')->distinct('claim_no')->get();
                }
            }

            //dd($claim_data);
            $claim_count = sizeof($claim_data);

            foreach ($claim_data as $key => $claim) {
                $dob = $claim_data[$key]['created_at'];
                // $claim_age = Carbon::parse($dob)->age;
                $claim_age = $dob->diff(Carbon::now())->format('%d');
                $claim_data[$key]['claim_age'] = $claim_age;

                if ($claim['substatus_code'] != NULL) {
                    $substatus = Sub_statuscode::where('id', $claim['substatus_code'])->get();
                    $claim_data[$key]['sub_status'] = $substatus[0]['description'];
                } else {
                    $claim_data[$key]['sub_status'] = 0;
                }


                if ($claim['rcm_work_order'] == NULL) {
                    $assigned_to = 'NA';
                    $assigned_by = 'NA';
                } else {

                    $assigned_data = Workorder_field::where('id', $claim['rcm_work_order'])->get();


                    $assigned_to = User::where('id', $claim['assigned_to'])->pluck('firstname');
                    $assigned_by = User::where('id', $assigned_data[0]['created_by'])->pluck('firstname');
                }


                $claim_data[$key]['assigned_to_name'] = $assigned_to;
                $claim_data[$key]['assigned_by_name'] = $assigned_by;

                $claim_data[$key]['touch'] = Claim_note::where('claim_id', $claim['claim_no'])->count();
            }

            return response()->json([
                'data'  => $claim_data,
                'count' => $claim_count
            ]);
        }
    }


    //   public function create_rcm_workorder(LoginRequest $request)
    //   {
    //       $user_id=$request->get('filter');
    //       $workorder_det=$request->get('assign_data');
    //       $claim_data=[];
    //       $i=1;
    //       foreach($workorder_det as $detail)
    //       {
    //           $client=$detail['client_id'];
    //           $claims=$detail['claims'];
    //           foreach($claims as $claim)
    //           {
    //               $update_claim =DB::table('import_fields')->where('claim_no',$claim)->update(array(
    //                   'claim_Status'          => "RCM Assigned",
    //                   'assigned_to'           =>  $client
    //                   ));
    //                   $claim_data[$i] = ["claim_no" => $claim, "state" => 8, "assigned_by" => $user_id, "assigned_to" => $client];
    //                   $i++;
    //                   }
    //                   }
    //                   $data= Record_claim_history::create_history($claim_data);
    //                    return response()->json([
    //                        'data' => $workorder_det,
    //                        'upld' => $data
    //                        ]);
    //                        }
}
