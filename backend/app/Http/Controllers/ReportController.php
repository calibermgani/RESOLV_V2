<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\Action;
use App\Models\Claim_note;
use App\Models\Import_field;
use App\Models\Insurance;
use App\Models\User;
use DateTime;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['get_buyer', 'get_report_claims', 'report_search', 'report_export_claims']]);
    }


    public function get_buyer(LoginRequest $request)
    {

        $insurane_name = Insurance::pluck('ins_name', 'id');

        return response()->json([
            'data' => $insurane_name
        ]);
    }


    public function get_report_claims(LoginRequest $request)
    {

        $page_no = $request->get('page');
        $page_count = $request->get('page_count');
        $sort_type = $request->get('sort_type');
        $type = $request->get('type');

        $start_time = $request->get('startTime');
        $end_time = $request->get('endTime');

        $trans_date_start_date = $request->get('trans_startDate');
        $trans_date_end_date = $request->get('trans_endDate');

        $dob_date_start_date = $request->get('dos_startDate');
        $dob_date_end_date = $request->get('dos_endDate');

        $total_count = 0;
        $skip = ($page_no - 1) * $page_count;
        $end = $page_count;

        $search_data = $request->get('data');

        $transaction_start_date = date('Y-m-d', strtotime($trans_date_start_date));

        $transaction_end_date = date('Y-m-d', strtotime($trans_date_end_date));

        $dos = $search_data['dos'];

        $dos_start_date = date('Y-m-d', strtotime($dob_date_start_date));

        $dos_end_date = date('Y-m-d', strtotime($dob_date_end_date));

        $buyer = (isset($search_data['buyer']) ? $search_data['buyer'] : '');


        if ($trans_date_start_date == null && $dob_date_start_date == null) {

            $claim_data = Import_field::leftjoin(DB::raw("(SELECT
      process_notes.claim_id,process_notes.content as process_notes
          FROM process_notes
          WHERE process_notes.deleted_at IS NULL
          AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
          GROUP BY process_notes.claim_id
          ) as process_notes"), function ($join) {
                $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
            })->leftjoin(DB::raw("(SELECT
      qc_notes.claim_id,qc_notes.content as qc_notes
          FROM qc_notes
          WHERE qc_notes.deleted_at IS NULL
          AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
          GROUP BY qc_notes.claim_id
          ) as qc_notes"), function ($join) {
                $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
            })->leftjoin(DB::raw("(SELECT
          claim_notes.claim_id,claim_notes.content as claims_notes
              FROM claim_notes
              WHERE claim_notes.deleted_at IS NULL
              AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
              GROUP BY claim_notes.claim_id
              ) as claim_notes"), function ($join) {
                $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
            })->offset($skip)->limit($end)->get();

            $current_total = $claim_data->count();

            $claim_count = Import_field::count();

            $selected_claim_data = Import_field::get();
        } else if ($trans_date_start_date == null && $dob_date_start_date != null) {

            if ($dos_start_date == $dos_end_date) {
                $claim_data = Import_field::leftjoin(DB::raw("(SELECT
              process_notes.claim_id,process_notes.content as process_notes
                  FROM process_notes
                  WHERE process_notes.deleted_at IS NULL
                  AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
                  GROUP BY process_notes.claim_id
                  ) as process_notes"), function ($join) {
                    $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
              qc_notes.claim_id,qc_notes.content as qc_notes
                  FROM qc_notes
                  WHERE qc_notes.deleted_at IS NULL
                  AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
                  GROUP BY qc_notes.claim_id
                  ) as qc_notes"), function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
                claim_notes.claim_id,claim_notes.content as claims_notes
                    FROM claim_notes
                    WHERE claim_notes.deleted_at IS NULL
                    AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
                    GROUP BY claim_notes.claim_id
                    ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->offset($skip)->limit($end)->get();

                $claim_count = Import_field::whereBetween('dos', [$dos_start_date, $dos_end_date])->count();

                $current_total = $claim_data->count();

                $selected_claim_data = Import_field::whereBetween('dos', [$dos_start_date, $dos_end_date])->get();
            } else {
                $claim_data = Import_field::leftjoin(DB::raw("(SELECT
            process_notes.claim_id,process_notes.content as process_notes
                FROM process_notes
                WHERE process_notes.deleted_at IS NULL
                AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
                GROUP BY process_notes.claim_id
                ) as process_notes"), function ($join) {
                    $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
            qc_notes.claim_id,qc_notes.content as qc_notes
                FROM qc_notes
                WHERE qc_notes.deleted_at IS NULL
                AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
                GROUP BY qc_notes.claim_id
                ) as qc_notes"), function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
                claim_notes.claim_id,claim_notes.content as claims_notes
                    FROM claim_notes
                    WHERE claim_notes.deleted_at IS NULL
                    AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
                    GROUP BY claim_notes.claim_id
                    ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->offset($skip)->limit($end)->get();

                $claim_count = Import_field::whereBetween('dos', [$dos_start_date, $dos_end_date])->count();

                $current_total = $claim_data->count();

                $selected_claim_data = Import_field::whereBetween('dos', [$dos_start_date, $dos_end_date])->get();
            }
        } elseif ($trans_date_start_date != null && $dob_date_start_date == null) {
            $transaction_start_time_date = date('Y-m-d H:i:s', strtotime($transaction_start_date . ' ' . $start_time));

            $transaction_end_time_date = date('Y-m-d H:i:s', strtotime($transaction_end_date . ' ' . $end_time));


            if ($transaction_start_date == $transaction_end_date) {

                $claim_data = Import_field::leftjoin(DB::raw("(SELECT
        process_notes.claim_id,process_notes.content as process_notes
            FROM process_notes
            WHERE process_notes.deleted_at IS NULL
            AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
            GROUP BY process_notes.claim_id
            ) as process_notes"), function ($join) {
                    $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
        qc_notes.claim_id,qc_notes.content as qc_notes
            FROM qc_notes
            WHERE qc_notes.deleted_at IS NULL
            AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
            GROUP BY qc_notes.claim_id
            ) as qc_notes"), function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
            claim_notes.claim_id,claim_notes.content as claims_notes
                FROM claim_notes
                WHERE claim_notes.deleted_at IS NULL
                AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
                GROUP BY claim_notes.claim_id
                ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '>=', $transaction_start_time_date)->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '<=', $transaction_end_time_date)->offset($skip)->limit($end)->get();

                $claim_count = Import_field::where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '>=', $transaction_start_time_date)->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '<=', $transaction_end_time_date)->count();

                $current_total = $claim_data->count();

                $selected_claim_data = Import_field::get();
            } else {

                $claim_data = Import_field::leftjoin(DB::raw("(SELECT
          process_notes.claim_id,process_notes.content as process_notes
              FROM process_notes
              WHERE process_notes.deleted_at IS NULL
              AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
              GROUP BY process_notes.claim_id
              ) as process_notes"), function ($join) {
                    $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
          qc_notes.claim_id,qc_notes.content as qc_notes
              FROM qc_notes
              WHERE qc_notes.deleted_at IS NULL
              AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
              GROUP BY qc_notes.claim_id
              ) as qc_notes"), function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
              claim_notes.claim_id,claim_notes.content as claims_notes
                  FROM claim_notes
                  WHERE claim_notes.deleted_at IS NULL
                  AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
                  GROUP BY claim_notes.claim_id
                  ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '>=', $transaction_start_time_date)->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '<=', $transaction_end_time_date)->offset($skip)->limit($end)->get();


                $claim_count = Import_field::where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '>=', $transaction_start_time_date)->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '<=', $transaction_end_time_date)->count();

                $current_total = $claim_data->count();

                $selected_claim_data = Import_field::get();
            }
        } elseif ($trans_date_start_date != null && $dob_date_start_date != null) {

            $transaction_start_time_date = date('Y-m-d H:i:s', strtotime($transaction_start_date . ' ' . $start_time));

            $transaction_end_time_date = date('Y-m-d H:i:s', strtotime($transaction_end_date . ' ' . $end_time));


            if ($transaction_start_date == $transaction_end_date  && $dos_start_date == $dos_end_date) {


                $claim_data = Import_field::leftjoin(DB::raw("(SELECT
          process_notes.claim_id,process_notes.content as process_notes
              FROM process_notes
              WHERE process_notes.deleted_at IS NULL
              AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
              GROUP BY process_notes.claim_id
              ) as process_notes"), function ($join) {
                    $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
          qc_notes.claim_id,qc_notes.content as qc_notes
              FROM qc_notes
              WHERE qc_notes.deleted_at IS NULL
              AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
              GROUP BY qc_notes.claim_id
              ) as qc_notes"), function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
              claim_notes.claim_id,claim_notes.content as claims_notes
                  FROM claim_notes
                  WHERE claim_notes.deleted_at IS NULL
                  AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
                  GROUP BY claim_notes.claim_id
                  ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '>=', $transaction_start_time_date)->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '<=', $transaction_end_time_date)->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->offset($skip)->limit($end)->get();

                $claim_count = Import_field::where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '>=', $transaction_start_time_date)->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '<=', $transaction_end_time_date)->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->count();

                $current_total = $claim_data->count();

                $selected_claim_data = Import_field::where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '>=', $transaction_start_time_date)->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '<=', $transaction_end_time_date)->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->get();
            } elseif ($transaction_start_date != $transaction_end_date  && $dos_start_date == $dos_end_date) {

                $claim_data = Import_field::leftjoin(DB::raw("(SELECT
      process_notes.claim_id,process_notes.content as process_notes
          FROM process_notes
          WHERE process_notes.deleted_at IS NULL
          AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
          GROUP BY process_notes.claim_id
          ) as process_notes"), function ($join) {
                    $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
      qc_notes.claim_id,qc_notes.content as qc_notes
          FROM qc_notes
          WHERE qc_notes.deleted_at IS NULL
          AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
          GROUP BY qc_notes.claim_id
          ) as qc_notes"), function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
          claim_notes.claim_id,claim_notes.content as claims_notes
              FROM claim_notes
              WHERE claim_notes.deleted_at IS NULL
              AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
              GROUP BY claim_notes.claim_id
              ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '>=', $transaction_start_time_date)->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '<=', $transaction_end_time_date)->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->offset($skip)->limit($end)->get();

                $claim_count = Import_field::where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '>=', $transaction_start_time_date)->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '<=', $transaction_end_time_date)->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->count();

                $current_total = $claim_data->count();

                $selected_claim_data = Import_field::where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '>=', $transaction_start_time_date)->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '<=', $transaction_end_time_date)->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->get();
            } elseif ($transaction_start_date != $transaction_end_date  && $dos_start_date != $dos_end_date) {

                $claim_data = Import_field::leftjoin(DB::raw("(SELECT
      process_notes.claim_id,process_notes.content as process_notes
          FROM process_notes
          WHERE process_notes.deleted_at IS NULL
          AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
          GROUP BY process_notes.claim_id
          ) as process_notes"), function ($join) {
                    $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
      qc_notes.claim_id,qc_notes.content as qc_notes
          FROM qc_notes
          WHERE qc_notes.deleted_at IS NULL
          AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
          GROUP BY qc_notes.claim_id
          ) as qc_notes"), function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
          claim_notes.claim_id,claim_notes.content as claims_notes
              FROM claim_notes
              WHERE claim_notes.deleted_at IS NULL
              AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
              GROUP BY claim_notes.claim_id
              ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '>=', $transaction_start_time_date)->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '<=', $transaction_end_time_date)->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->offset($skip)->limit($end)->get();


                $claim_count = Import_field::where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '>=', $transaction_start_time_date)->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '<=', $transaction_end_time_date)->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date)->offset($skip)->limit($end)->count();

                $current_total = $claim_data->count();

                $selected_claim_data = Import_field::whereBetween('created_at', [$transaction_start_time_date, $transaction_end_time_date])->orWhereBetween('dos', [$dos_start_date, $dos_end_date])->get();
            }
        }

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
                $claim_data[$key]['created'] = date('m-d-yy', strtotime($assigned_data['created_at']));



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


    public function report_export_claims(LoginRequest $request)
    {

        $search_data = $request->get('filter');
        $table_name = $request->get('table_name');
        $start_time = $request->get('startTime');
        $end_time = $request->get('endTime');

        $trans_date_start_date = $request->get('trans_startDate');
        $trans_date_end_date = $request->get('trans_endDate');

        $dob_date_start_date = $request->get('dos_startDate');
        $dob_date_end_date = $request->get('dos_endDate');

        $transaction_start_date = date('Y-m-d', strtotime($trans_date_start_date));

        $transaction_end_date = date('Y-m-d', strtotime($trans_date_end_date));

        $dos = $search_data['dos'];

        $dos_start_date = date('Y-m-d', strtotime($dob_date_start_date));

        $dos_end_date = date('Y-m-d', strtotime($dob_date_end_date));

        $buyer = (isset($search_data['buyer']) ? $search_data['buyer'] : '');

        $transaction_start_time_date = date('Y-m-d H:i:s', strtotime($transaction_start_date . ' ' . $start_time));

        $transaction_end_time_date = date('Y-m-d H:i:s', strtotime($transaction_end_date . ' ' . $end_time));

        $claim_data = Import_field::where('id', '!=', '0');

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



        if ($dob_date_start_date != null && $trans_date_end_date == null) {

            if ($dos_start_date == $dos_end_date) {

                $claim_data = Import_field::leftjoin(DB::raw("(SELECT
              process_notes.claim_id,process_notes.content as process_notes
                  FROM process_notes
                  WHERE process_notes.deleted_at IS NULL
                  AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
                  GROUP BY process_notes.claim_id
                  ) as process_notes"), function ($join) {
                    $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
              qc_notes.claim_id,qc_notes.content as qc_notes
                  FROM qc_notes
                  WHERE qc_notes.deleted_at IS NULL
                  AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
                  GROUP BY qc_notes.claim_id
                  ) as qc_notes"), function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
              claim_notes.claim_id,claim_notes.content as claims_notes
                  FROM claim_notes
                  WHERE claim_notes.deleted_at IS NULL
                  AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
                  GROUP BY claim_notes.claim_id
                  ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
            } else {

                $claim_data = Import_field::leftjoin(DB::raw("(SELECT
              process_notes.claim_id,process_notes.content as process_notes
                  FROM process_notes
                  WHERE process_notes.deleted_at IS NULL
                  AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
                  GROUP BY process_notes.claim_id
                  ) as process_notes"), function ($join) {
                    $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
              qc_notes.claim_id,qc_notes.content as qc_notes
                  FROM qc_notes
                  WHERE qc_notes.deleted_at IS NULL
                  AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
                  GROUP BY qc_notes.claim_id
                  ) as qc_notes"), function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
              claim_notes.claim_id,claim_notes.content as claims_notes
                  FROM claim_notes
                  WHERE claim_notes.deleted_at IS NULL
                  AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
                  GROUP BY claim_notes.claim_id
                  ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
            }
        } elseif (
            $trans_date_start_date  != null && $dob_date_start_date
            == null
        ) {

            if ($transaction_start_date == $transaction_end_date) {


                $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                  process_notes.claim_id,process_notes.content as process_notes
                      FROM process_notes
                      WHERE process_notes.deleted_at IS NULL
                      AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
                      GROUP BY process_notes.claim_id
                      ) as process_notes"), function ($join) {
                    $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
                  qc_notes.claim_id,qc_notes.content as qc_notes
                      FROM qc_notes
                      WHERE qc_notes.deleted_at IS NULL
                      AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
                      GROUP BY qc_notes.claim_id
                      ) as qc_notes"), function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
                  claim_notes.claim_id,claim_notes.content as claims_notes
                      FROM claim_notes
                      WHERE claim_notes.deleted_at IS NULL
                      AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
                      GROUP BY claim_notes.claim_id
                      ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '>=', $transaction_start_time_date)->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '<=', $transaction_end_time_date);
            } else {

                $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                process_notes.claim_id,process_notes.content as process_notes
                    FROM process_notes
                    WHERE process_notes.deleted_at IS NULL
                    AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
                    GROUP BY process_notes.claim_id
                    ) as process_notes"), function ($join) {
                    $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
                qc_notes.claim_id,qc_notes.content as qc_notes
                    FROM qc_notes
                    WHERE qc_notes.deleted_at IS NULL
                    AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
                    GROUP BY qc_notes.claim_id
                    ) as qc_notes"), function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
                claim_notes.claim_id,claim_notes.content as claims_notes
                    FROM claim_notes
                    WHERE claim_notes.deleted_at IS NULL
                    AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
                    GROUP BY claim_notes.claim_id
                    ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '>=', $transaction_start_time_date)->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '<=', $transaction_end_time_date);
            }
        } elseif (
            $trans_date_start_date  != null && $dob_date_start_date
            != null
        ) {

            if ($transaction_start_date == $transaction_end_date && $dos_start_date == $dos_end_date) {


                $claim_data = Import_field::leftjoin(DB::raw("(SELECT
              process_notes.claim_id,process_notes.content as process_notes
                  FROM process_notes
                  WHERE process_notes.deleted_at IS NULL
                  AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
                  GROUP BY process_notes.claim_id
                  ) as process_notes"), function ($join) {
                    $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
              qc_notes.claim_id,qc_notes.content as qc_notes
                  FROM qc_notes
                  WHERE qc_notes.deleted_at IS NULL
                  AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
                  GROUP BY qc_notes.claim_id
                  ) as qc_notes"), function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
              claim_notes.claim_id,claim_notes.content as claims_notes
                  FROM claim_notes
                  WHERE claim_notes.deleted_at IS NULL
                  AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
                  GROUP BY claim_notes.claim_id
                  ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '>=', $transaction_start_time_date)->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '<=', $transaction_end_time_date)->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
            } elseif ($trans_date_start_date != $trans_date_end_date  && $dob_date_start_date == $dob_date_end_date) {

                $claim_data = Import_field::leftjoin(DB::raw("(SELECT
                process_notes.claim_id,process_notes.content as process_notes
                    FROM process_notes
                    WHERE process_notes.deleted_at IS NULL
                    AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
                    GROUP BY process_notes.claim_id
                    ) as process_notes"), function ($join) {
                    $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
                qc_notes.claim_id,qc_notes.content as qc_notes
                    FROM qc_notes
                    WHERE qc_notes.deleted_at IS NULL
                    AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
                    GROUP BY qc_notes.claim_id
                    ) as qc_notes"), function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
                claim_notes.claim_id,claim_notes.content as claims_notes
                    FROM claim_notes
                    WHERE claim_notes.deleted_at IS NULL
                    AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
                    GROUP BY claim_notes.claim_id
                    ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '>=', $transaction_start_time_date)->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '<=', $transaction_end_time_date)->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
            } elseif ($trans_date_start_date != $trans_date_end_date  && $dob_date_start_date != $dob_date_end_date) {

                $claim_data = Import_field::leftjoin(DB::raw("(SELECT
              process_notes.claim_id,process_notes.content as process_notes
                  FROM process_notes
                  WHERE process_notes.deleted_at IS NULL
                  AND process_notes.id IN (SELECT MAX(id) FROM process_notes GROUP BY process_notes.claim_id)
                  GROUP BY process_notes.claim_id
                  ) as process_notes"), function ($join) {
                    $join->on('process_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
              qc_notes.claim_id,qc_notes.content as qc_notes
                  FROM qc_notes
                  WHERE qc_notes.deleted_at IS NULL
                  AND qc_notes.id IN (SELECT MAX(id) FROM qc_notes GROUP BY qc_notes.claim_id)
                  GROUP BY qc_notes.claim_id
                  ) as qc_notes"), function ($join) {
                    $join->on('qc_notes.claim_id', '=', 'import_fields.claim_no');
                })->leftjoin(DB::raw("(SELECT
              claim_notes.claim_id,claim_notes.content as claims_notes
                  FROM claim_notes
                  WHERE claim_notes.deleted_at IS NULL
                  AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id)
                  GROUP BY claim_notes.claim_id
                  ) as claim_notes"), function ($join) {
                    $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
                })->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '>=', $transaction_start_time_date)->where(DB::raw('CONVERT_TZ(import_fields.created_at,"+00:00","+05:30")'), '<=', $transaction_end_time_date)->where(DB::raw('DATE(import_fields.dos)'), '>=', $dos_start_date)->where(DB::raw('DATE(import_fields.dos)'), '<=', $dos_end_date);
            }
        }

        $claim_data = $claim_data->get()->toArray();



        foreach ($claim_data as $key => $value) {
            $dos = strtotime($claim_data[$key]['dos']);

            if (!empty($dos)) {
                $claim_data[$key]['dos'] = date('m/d/Y', $dos);
            }

            $dob = strtotime($claim_data[$key]['dob']);

            if (!empty($dob)) {
                $claim_data[$key]['dob'] = date('m/d/Y', $dob);
            }

            $admit_date = strtotime($claim_data[$key]['admit_date']);

            if (!empty($admit_date)) {
                $claim_data[$key]['admit_date'] = date('m/d/Y', $admit_date);
            }

            $discharge_date = strtotime($claim_data[$key]['discharge_date']);

            if (!empty($discharge_date)) {

                $claim_data[$key]['discharge_date'] = date('m/d/Y', $discharge_date);
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


        //dd($op_data['datas']);

        return response()->json([
            'data'  => $claim_data,
            'table' => $table_name
        ]);
    }
}
