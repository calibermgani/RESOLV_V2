<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApiRequest;
use App\Http\Requests\LoginRequest;
use App\Models\Action;
use App\Models\Claim_history;
use App\Models\Claim_note;
use App\Models\Import_field;
use App\Models\Line_item;
use App\Models\Statuscode;
use App\Models\User;
use App\Models\User_work_profile;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class GraphController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['get_claim_graph_stats', 'fetch_assoc_detail', 'get_claim_table_stats', 'get_summary_details', 'get_prod_qual', 'get_month_details', 'process_weekly_data', 'get_audit_graph']]);
    }

    public function get_claim_graph_stats(LoginRequest $request)
    {
        $user_name = $request->get('user');
        $interval = 30;
        $records = [];
        $records_date = [];

        $last_assign = Claim_history::orderBy('created_at', 'desc')->first();

        if ($last_assign != null) {



            $dates_value = [];
            $op_value = [];
            $temp_value = [];

            $last_assign_month = $last_assign->created_at->format('m');
            $last_assign_year = $last_assign->created_at->format('Y');

            // $last_assign_month=1;
            //Get Dates
            if ($last_assign_month > 0 && $last_assign_month <= 3 && $last_assign_month > 0) {
                $prev_year = $last_assign_year - 1;
                $y_val[0] = ['01-04-' . $prev_year, '30-06-' . $prev_year];
                $y_val[1] = ['01-07-' . $prev_year, '31-09-' . $prev_year];
                $y_val[2] = ['01-10-' . $prev_year, '31-12-' . $prev_year];
                $y_val[3] = ['01-01-' . $last_assign_year, '31-03-' . $last_assign_year];

                array_push($temp_value, [$prev_year, $prev_year, $prev_year, $last_assign_year]);
            } else if ($last_assign_month > 3 && $last_assign_month <= 6) {
                $prev_year = $last_assign_year - 1;

                $y_val[0] = ['01-07-' . $prev_year, '31-09-' . $prev_year];
                $y_val[1] = ['01-10-' . $prev_year, '31-12-' . $prev_year];
                $y_val[2] = ['01-01-' . $last_assign_year, '31-03-' . $last_assign_year];
                $y_val[3] = ['01-04-' . $last_assign_year, '30-06-' . $last_assign_year];

                array_push($temp_value, [$prev_year, $prev_year, $last_assign_year, $last_assign_year]);
            } else if ($last_assign_month > 6 && $last_assign_month <= 9) {
                $prev_year = $last_assign_year - 1;
                $y_val[0] = ['01-10-' . $prev_year, '31-12-' . $prev_year];
                $y_val[1] = ['01-01-' . $last_assign_year, '31-03-' . $last_assign_year];
                $y_val[2] = ['01-04-' . $last_assign_year, '30-06-' . $last_assign_year];
                $y_val[3] = ['01-07-' . $last_assign_year, '31-09-' . $last_assign_year];

                array_push($temp_value, [$prev_year, $last_assign_year, $last_assign_year, $last_assign_year]);
            } else if ($last_assign_month > 9 && $last_assign_month <= 12) {
                $prev_year = $last_assign_year - 1;
                $y_val[0] = ['01-01-' . $last_assign_year, '31-03-' . $last_assign_year];
                $y_val[1] = ['01-04-' . $last_assign_year, '30-06-' . $last_assign_year];
                $y_val[2] = ['01-07-' . $last_assign_year, '31-09-' . $last_assign_year];
                $y_val[3] = ['01-10-' . $last_assign_year, '31-12-' . $last_assign_year];

                array_push($temp_value, [$last_assign_year, $last_assign_year, $last_assign_year, $last_assign_year]);
            }

            $op_value['year'] = $temp_value;
            $temp_value = [];


            //Get Claim Records

            foreach ($y_val as $y) {
                $dates = [];
                foreach ($y as $date) {
                    array_push($dates, date('Y-m-d:H:i:s', strtotime($date)));
                }

                array_push($dates_value, $dates);
            }

            foreach ($dates_value as $date) {
                $assigned = Claim_history::where('claim_state', 3)->whereBetween('created_at', [$date[0], $date[1]])->groupBy('claim_id')->get();
                $worked = Claim_history::whereIN('claim_state', [4, 7, 8, 9])->whereBetween('created_at', [$date[0], $date[1]])->groupBy('claim_id')->get();
                array_push($temp_value, [sizeOf($assigned), sizeOf($worked)]);
            }

            $op_value['data'] = $temp_value;
        } else if ($last_assign == null) {
            $op_value = [];
            // $daily_act=[];
        }
        //





        //    $op_value['date']=$users;
        $date_from = \Carbon\Carbon::today()->subDays($interval - 1)->format('Y-m-d');
        $date_to = \Carbon\Carbon::today()->format('Y-m-d');

        // $period = CarbonPeriod::create('2018-06-14', '2018-06-20');


        /*Calculate Days*/
        // $last_date=$date_from->format( 'Y-m-t' );
        // $remaining_days= date_diff($last_date,$date_from);

        //                 $first_date = new DateTime($date_from);

        // $last_date = new DateTime($date_to);

        //                 $daterange = $first_date->diff($last_date)->format("%r%a");

        $curr = $date_from;
        $daterange = [];

        for ($i = 0; $i < $interval; $i++) {
            $date_day = date('d', strtotime($curr));
            $date_day = (int) $date_day;
            array_push($daterange, $date_day);


            $next_date = date('Y-m-d', strtotime($curr . ' +1 day'));
            $curr = $next_date;
        }

        $daily_records = DB::table("claim_histories")
            //    ->where('claim_state', 3)
            ->whereDate('created_at', '>', Carbon::now()->subDays($interval))
            ->groupBy('created_at')
            ->get();


        foreach ($daily_records as $rec) {
            $date = $rec->created_at;

            $date = date('Y-m-d', strtotime($date));

            $date_day = date('d', strtotime($date));
            if (!in_array($date_day, $records_date)) {
                $next_date = date('Y-m-d', strtotime($date . ' +1 day'));


                $assigned = Claim_history::where('claim_state', 3)->where('created_at', '>=', $date)->where('created_at', '<=', $next_date)->count();
                $completed = Claim_history::where('claim_state', 9)->where('created_at', '>=', $date)->where('created_at', '<=', $next_date)->count();
                $date_day = (int) $date_day;
                array_push($records_date, $date_day);
                array_push($records, [$assigned, $completed]);
            }




            // if(in_array($date,$records_date))
            // {
            //     // $index = array_search($date,$records_date);
            //     // $values=$records[$index];
            //     // array_push($values,$rec);
            //     // $records[$index] = $values;
            // }
            // else{

            // }
        }
        $daily_act['days'] = $records_date;
        $daily_act['work'] = $records;
        $daily_act['dates'] = $daterange;






        return response()->json([
            'data' => $op_value,
            'daily' => $daily_act,
            'insurance' => $daily_records
            // 'status' => $status_details,
            // 'associate' => $associate_details
        ]);
    }

    public function get_claim_table_stats(LoginRequest $request)
    {
        //Insurance Tab
        $insurance = Import_field::distinct('prim_ins_name')->pluck('prim_ins_name');
        $insurance_details = $this->calculate_status($insurance, 'insurance');

        //Status_wise
        $data = Statuscode::all()->pluck('id');
        $status_details = $this->calculate_status($data, 'status');

        //Associates
        $data = User::whereIN('role_id', [1, 2])->pluck('id');
        $associate_details = $this->calculate_status($data, 'associate');



        return response()->json([
            'insurance' => $insurance_details,
            'status' => $status_details,
            'associate' => $associate_details
        ]);
    }




    protected function calculate_status($data, $type)
    {
        $insurance_details = [];
        $total_30 = 0;
        $total_60 = 0;
        $total_90 = 0;
        $total_180 = 0;
        $total_365 = 0;
        $totalp_365 = 0;
        $total_nos = 0;
        $tot_total = 0;

        $total_120 = 0;
        $pending = 0;
        $completed = 0;


        $i = 0;
        foreach ($data as $ins) {
            $ins_data = [];
            if ($type == 'insurance') {
                $claim_count = Import_field::where('prim_ins_name', $ins)->count();
                $claims = Import_field::where('prim_ins_name', $ins)->get();
            } else if ($type == 'status') {
                $claim_count = Import_field::where('status_code', $ins)->count();
                $claims = Import_field::where('status_code', $ins)->get();
            } else if ($type == 'associate') {
                $get_claims = Action::orderBy('created_at', 'desc')->distinct('claim_id')->where('assigned_to', $ins)->where('status', 'Active')->pluck('claim_id');
                // Action::where('claim_id', $claim_data[$key]['claim_no'])->orderBy('created_at', 'desc')->first();

                $pending = Import_field::whereIn('claim_no', $get_claims)->where('claim_Status', 'Assigned')->count();
                $completed = Import_field::whereIn('claim_no', $get_claims)->where('claim_Status', 'Completed')->count();




                $claim_count = Import_field::whereIn('claim_no', $get_claims)->count();
                $claims = Import_field::whereIN('claim_no', $get_claims)->get();
            }


            $age_details = [];
            $below_30 = 0;
            $below_60 = 0;
            $below_90 = 0;
            $below_180 = 0;
            $below_365 = 0;
            $above_365 = 0;

            $above_120 = 0;

            $age_data = [];


            // if(count($claims) != 0)
            // {

            foreach ($claims as $claim_data) {
                $sum_ins_ar = Line_item::where('claim_id', $claim_data['claim_no'])->sum('ins_ar');

                $dob = $claim_data['created_at'];
                // $claim_age = Carbon::parse($dob)->age;
                $claim_age = $dob->diff(Carbon::now())->format('%a');

                if ($claim_age >= 0 && $claim_age <= 30) {
                    $below_30 += $sum_ins_ar;
                    $total_30 += $sum_ins_ar;
                } else if ($claim_age > 30 && $claim_age <= 60) {
                    $below_60 += $sum_ins_ar;
                    $total_60 += $sum_ins_ar;
                } else if ($claim_age >= 60 && $claim_age <= 90) {
                    $below_90 += $sum_ins_ar;
                    $total_90 += $sum_ins_ar;
                } else if ($claim_age > 90 && $claim_age <= 180 && $type != 'associate' || $claim_age >= 90 && $claim_age <= 120 && $type == 'associate') {
                    $below_180 += $sum_ins_ar;
                    $total_180 += $sum_ins_ar;
                } else if ($claim_age > 180 && $claim_age <= 365) {
                    $below_365 += $sum_ins_ar;
                    $total_365 += $sum_ins_ar;
                } else if ($claim_age > 365) {
                    $above_365 += $sum_ins_ar;
                    $totalp_365 += $sum_ins_ar;
                } else if ($claim_age > 120 && $claim_age <= 180 && $type == 'associate') {
                    $above_120 += $sum_ins_ar;
                    $total_120 += $sum_ins_ar;
                }
                $tot_total += $sum_ins_ar;
                // array_push($age_data,[$dob,$claim_age]);
            }

            if ($type == 'associate') {
                array_push($age_details, [number_format($below_30, 2), number_format($below_60, 2), number_format($below_90, 2), number_format($above_120, 2), number_format($below_180, 2), number_format($below_365, 2), number_format($above_365, 2), number_format(($below_30 + $below_60 + $below_90 + $above_120 + $below_180 + $below_365 + $above_365), 2)]);
            } else {
                array_push($age_details, [number_format($below_30, 2), number_format($below_60, 2), number_format($below_90, 2), number_format($below_180, 2), number_format($below_365, 2), number_format($above_365, 2), number_format(($below_30 + $below_60 + $below_90 + $below_180 + $below_365 + $above_365), 2)]);
            }


            if ($type == 'status') {
                $ins = Statuscode::where('id', $ins)->pluck('description');
                $ins = $ins[0];
            } else if ($type == 'associate') {
                $ins_data['pending'] = $pending;
                $ins_data['completed'] = $completed;
                $ins_data['assoc_id'] = $ins;

                $ins = User::where('id', $ins)->select('firstname', 'lastname')->get();
                $ins = $ins[0]['firstname'] . " " . $ins[0]['lastname'];
            }
            $ins_data['name'] = $ins;
            $ins_data['claims'] = sizeof($claims);
            $ins_data['values'] = $age_details;



            //Age Data
            // $insurance_details['age_data'][$i]=$age_data;

            $insurance_details['ins_data'][$i] = $ins_data;
            $total_nos += sizeof($claims);



            $i++;
        }

        $percentage = [];
        if ($type == 'associate') {
            $insurance_details['total_data'] = [$total_nos, number_format($total_30, 2), number_format($total_60, 2), number_format($total_90, 2), number_format($total_120, 2), number_format($total_180, 2), number_format($total_365, 2), number_format($totalp_365, 2), number_format($tot_total, 2)];
            $total_values = [$total_30, $total_60, $total_90, $above_120, $total_180, $total_365, $totalp_365, $tot_total];
        } else {
            $insurance_details['total_data'] = [$total_nos, number_format($total_30, 2), number_format($total_60, 2), number_format($total_90, 2), number_format($total_180, 2), number_format($total_365, 2), number_format($totalp_365, 2), number_format($tot_total, 2)];


            $total_values = [$total_30, $total_60, $total_90, $total_180, $total_365, $totalp_365, $tot_total];
        }


        for ($i = 0; $i < sizeof($total_values) - 1; $i++) {
            $percent = 0.00;
            $percent = ($total_values[sizeof($total_values) - 1] != 0) ? ($total_values[$i] / $total_values[sizeof($total_values) - 1]) * 100 : 0;
            array_push($percentage, $percent);
        }
        $insurance_details['total_per'] = $percentage;

        // }



        return $insurance_details;
    }

    public function fetch_assoc_detail(LoginRequest $request)
    {
        $assoc_id = $request->get('user');
        $user_det = User::where('id', $assoc_id)->first();
        $desig = DB::table('roles')->where('id', $user_det['role_id'])->first();

        $work_prof = User_work_profile::where('user_id', $assoc_id)->first();

        $get_claims = Action::orderBy('created_at', 'desc')->distinct('claim_id')->where('assigned_to', $assoc_id)->where('status', 'Active')->pluck('claim_id');

        $pending = Import_field::whereIn('claim_no', $get_claims)->where('claim_Status', 'Assigned')->count();
        $follow_up = Import_field::whereIn('claim_no', $get_claims)->whereNOTIN('claim_Status', ['Assigned', 'Completed'])->count();
        $completed = Import_field::whereIn('claim_no', $get_claims)->where('claim_Status', 'Completed')->count();


        $touch_limit = 0;
        $destinationPath = public_path('../config/practice_settings.txt');
        if (File::exists($destinationPath)) {
            $jsondec = json_decode(file_get_contents($destinationPath), true);
            $touch_limit = $jsondec['touch_limit'];
        } else {
            $touch_limit = 0;
        }

        $touch_count = Claim_note::whereIN('claim_id', $get_claims)->having('count', '>', 5)->groupBy('claim_id')->selectRaw('*, count(*) AS count')->get();


        $claim_data['pending'] = $pending;
        $claim_data['follow'] = $follow_up;
        $claim_data['completed'] = $completed;
        $claim_data['limit'] = $touch_limit;
        $claim_data['user_data'] = $user_det;
        $claim_data['work_prof'] = $work_prof;
        $claim_data['exceed'] = sizeof($touch_count);
        $claim_data['desig'] = $desig['role_name'];

        // dd($claim_data);

        return response()->json([

            'claims' => $claim_data,

        ]);
    }

    public function get_summary_details(LoginRequest $request)
    {
        $user_id = $request->get('user');
        $user_role = User::where('id', $user_id)->first();

        $start = Carbon::now()->startOfMonth();
        $end = Carbon::now();


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

        foreach ($count as $values) {

            $claim_data[] = Import_field::where('claim_no',  $values)->where('assigned_to', $user_id)->where('claim_status', 'Assigned')->get()->toArray();
        }
        $claim_array = array_filter(array_map('array_filter', $claim_data));

        $multi_claim_data = $claim_array;

        $merge_claim_data = array_reduce($multi_claim_data, 'array_merge', array());

        $assign = array_column($merge_claim_data, 'claim_no');


        $assigned = Import_field::leftjoin(DB::raw("(SELECT
				claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
			  AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
        })->whereIN('claim_no', $assign)->where('assigned_to', $user_id)->get();

        //$assigned= Claim_history::where('claim_state',3)->where('assigned_to',$user_id)->whereBetween('created_at', [$start, $end])->groupBy('claim_id')->get();

        $Claim_history = Claim_history::where('assigned_by', $user_id)->where('claim_state', 4)->orderBy('id', 'desc')->groupBy('claim_id')->get();

        foreach ($Claim_history as $key => $active) {
            $query = DB::table('claim_histories')
                ->select(DB::raw("COUNT(claim_id) count, claim_id, id"))
                ->where('claim_id', $active['claim_id'])
                ->where('claim_state', 4)
                ->where('assigned_by', $user_id)

                ->get()->toArray();
            $count[$key] = (isset($query[0])) ? $query[0]->claim_id : 0;
        }


        foreach ($count as $values) {

            $worked_claim_data[] = Import_field::where('claim_no',  $values)->get()->toArray();
        }
        $worked_claim_array = array_filter(array_map('array_filter', $worked_claim_data));

        $worked_multi_claim_data = $worked_claim_array;

        $worked_merge_claim_data = array_reduce($worked_multi_claim_data, 'array_merge', array());

        $worked = array_column($worked_merge_claim_data, 'claim_no');


        $worked_claims = Import_field::leftjoin(DB::raw("(SELECT
				claim_notes.claim_id,claim_notes.content as claims_notes FROM claim_notes WHERE  claim_notes.deleted_at IS NULL
			  AND claim_notes.id IN (SELECT MAX(id) FROM claim_notes GROUP BY claim_notes.claim_id) GROUP BY claim_notes.claim_id ) as claim_notes"), function ($join) {
            $join->on('claim_notes.claim_id', '=', 'import_fields.claim_no');
        })->whereIN('claim_no', $worked)->where('assigned_to', $user_id)->get();

        $touches_3 = DB::table('claim_notes')
            ->select(DB::raw("COUNT(id) , claim_id, id"))
            ->where('created_by', $user_id)
            ->havingRaw("COUNT(claim_id) > 3")
            ->groupBy('claim_id')
            ->get();


        return response()->json([
            'assigned' => sizeOf($assigned),
            'worked'   => sizeOf($worked_claims),
            'pending'  => sizeOf($assigned),
            'followup' => sizeOf($assigned),
            'auditclaims' => sizeOf($worked_claims),
            '3touches' => sizeOf($touches_3),
        ]);
    }

    public function get_month_details()
    {

        $working_data = $this->week_month_calc();
        return response()->json([

            // 'days' => $curr_month,
            // 'days2' => $month,
            'weeks' => $working_data['weeks'],
            'working' => $working_data['days']

        ]);
    }

    public function get_prod_qual(LoginRequest $request)
    {
        $user_id = $request->get('user');
        $days = $request->get('day');

        $prod_data = $this->calc_prod_qual($user_id, $days);


        return response()->json([
            'data' => $prod_data['date'],
            'assigned' => $prod_data['target'],
            'worked' => $prod_data['achieved'],
            'work_per' => $prod_data['achieved_per']
            // 'next'=>$date1,
            // 'date2'=>$date2
        ]);
    }


    private function calc_prod_qual($user_id, $days)
    {
        $assigned = [];
        $achieved = [];
        $achieved_per = [];
        // $date1=[];
        // $date2=[];

        $i = 0;
        $target_data = [];
        foreach ($days as $work) {
            $i++;
            // $next_day=date('Y-m-d H:i:s', strtotime());

            $next_day = date('Y-m-d H:i:s', strtotime($work['date'] . ' +1 day'));

            $today =  date('Y-m-d H:i:s');
            // $next_day=$next_day->addDays(1);
            //Assigned\
            if ($today >= $work['date'] && $today <= $next_day) {
                $target = User_work_profile::where('user_id', $user_id)->orderBy('id', 'desc')->where('created_at', '>=', $work['date'])->where('created_at', '<=', $next_day)->first();

                if ($target == null) {
                    $target = User_work_profile::where('user_id', $user_id)->orderBy('id', 'desc')->where('created_at', '<', $work['date'])->first();
                }
            } else {
                $target = User_work_profile::where('user_id', $user_id)->orderBy('id', 'desc')->where('created_at', '<=', $work['date'])->first();
            }
            array_push($target_data, $target['caller_benchmark']);
            //Worked
            $worked = Claim_history::whereIN('claim_state', [4, 7, 8, 9])->where('assigned_by', $user_id)->where('created_at', '>=', $work['date'])->where('created_at', '<=', $next_day)->count();
            array_push($achieved, $worked);

            //Achieved %
            $percent = ($target['caller_benchmark']) ? ($worked / $target['caller_benchmark']) * 100 : 0;

            // ($total_values[sizeof($total_values)-1] != 0) ? ($total_values[$i]/$total_values[sizeof($total_values)-1])*100 : 0;
            $percent = number_format($percent, 2, '.', '');
            array_push($achieved_per, $percent);




            // $get_assigned= Claim_history::where('claim_state',3)->where('assigned_to',$user_id)->where('created_at', '>=', $work['date'])->where('created_at', '<=', $next_day)->get();
            // array_push($assigned,sizeOf($get_assigned));
            // // array_push($date1,$work['date']);
            // // array_push($date2,$next_day);
            // $worked_nos=[];
            // $pending_nos=0;
            // foreach($get_assigned as $claim)
            // {
            //     $worked= Claim_history::where('claim_id', $claim['claim_id'])->whereIN('claim_state',[4,7,8,9])->where('assigned_by',$user_id)->where('created_at', '>=', $work['date'])->where('created_at', '<=', $next_day)->get();

            //     // if(sizeOf($worked) !=0)
            //     // {
            //     //     if($worked[0]['status'] == 'Inactive')
            //     //     {
            //     //         $worked_nos++;
            //     //     }
            //     //     else{
            //     //         $pending_nos++;
            //     //     }
            //     // }
            //     if(sizeOf($worked) !=0)
            //     {
            //     array_push($worked_nos,$worked);
            //     }
            // }

        }

        if ($target_data == null) {
            $target_data = 0;
        }


        $return_data['date'] = $work['date'];
        $return_data['target'] = $target_data;
        $return_data['achieved'] = $achieved;
        $return_data['achieved_per'] = $achieved_per;

        return $return_data;
    }


    private function week_month_calc()
    {
        $start = Carbon::now()->startOfMonth();
        // $end = Carbon::now()->endOfMonth();

        $working = [];

        // $holidays = [
        //     Carbon::create(2014, 2, 2),
        //     Carbon::create(2014, 4, 17),
        //     Carbon::create(2014, 5, 19),
        //     Carbon::create(2014, 7, 3),
        // ];

        // $days = $start->diffInDaysFiltered(function (Carbon $date) use ($holidays) {


        // $week_days=function (Carbon $date) {

        //     return $date->isWeekday();

        // };

        // $start_date=$start;

        // $days = $start_date->diffInDaysFiltered($week_days, $end);
        $daily = [];
        $days = date('t');
        $month = (int)date('m');
        // $weeks=$start->weeksInMonth;
        $week = 0;
        $working_weeks = [];
        $working_days = [];
        for ($i = 0; $i < $days; $i++) {
            $curr_month = (int)$start->format('m');

            if ($curr_month == $month) {
                $week_day = $start->isWeekday();

                if ($week_day == true) {
                    array_push($working, $start->copy());
                    array_push($working_days, $start->copy());
                    $start->modify('+1 day');
                } else if ($week_day == false && sizeof($working) != 0) {
                    $working_weeks[$week] = $working;
                    $week++;
                    $start->modify('+2 day');
                    $working = [];
                } else {

                    //For 1st SAT
                    if ($week == 0) {
                        array_push($working, $start->copy());
                        array_push($working_days, $start->copy());
                        $working_weeks[$week] = $start;
                        $week++;

                        $working = [];
                    }

                    $start->modify('+1 day');
                }
            } else {
                // array_push($working,$start->copy());
                // array_push($working_days,$start->copy());
                $working_weeks[$week] = $working;
                break;
            }
        }

        $return['weeks'] = $working_weeks;
        $return['days'] = $working_days;

        return $return;
    }

    public function process_weekly_data(LoginRequest $request)
    {
        $dates = $this->week_month_calc();
        $days = $dates['days'];
        $weeks = $dates['weeks'];
        $working_days = [];

        // dd($days);

        //    $days=json_decode($days);

        $user_id = $request->get('user');



        foreach ($days as $day) {
            $day_work = json_encode($day);

            $day_work = json_decode($day_work, true);

            array_push($working_days, $day_work);
        }

        $prod_data = $this->calc_prod_qual($user_id, $working_days);
        // dd($prod_data);
        $total_target = [];
        $total_per = [];

        $target = $prod_data['target'];
        $ach_per = $prod_data['achieved_per'];

        $j = 0;
        foreach ($weeks as $week) {
            if (!is_array($week) && $week != null) {
                $week_size = 1;
            } else {
                $week_size = sizeof($week);
            }

            $tot = 0;
            $avg_per = 0.0;

            $date = Carbon::now();

            // $curr_date= $date->startOfWeek();
            if ($week_size > 1) {
                if ($week[0] < $date) {
                    for ($i = 0; $i < $week_size; $i++) {
                        $tot += $target[$j];
                        $avg_per += $ach_per[$j];
                        $j++;
                    }

                    array_push($total_target, $tot);

                    $avg_per = $avg_per / $week_size;

                    array_push($total_per, $avg_per);
                }
            } elseif ($week_size == 1) {
                if ($week < $date) {

                    $tot += $target[$j];
                    $avg_per += $ach_per[$j];
                    $j++;


                    array_push($total_target, $tot);

                    $avg_per = $avg_per / $week_size;

                    array_push($total_per, $avg_per);
                }
            }
        }



        return response()->json([
            // 'user' =>$user_id,
            'weeks' => $weeks,
            // 'days'=>$prod_data,
            'ach_per' => $total_per,
            'target' => $total_target
        ]);
    }

    public function get_audit_graph(ApiRequest $request)
    {
        $user_id = $request->get('user');

        $dates = $this->week_month_calc();
        $day_data = $dates['days'];
        $today = Carbon::now()->startOfDay();


        //Days Calculation
        $found = false;
        foreach ($day_data as $key => $day) {
            if ($day == $today) {
                $found = true;
                break;
            }
        }
        // $dates_good=[];
        $array = (array) $day_data;
        $dates_good = array_splice($array, $key - 6, 7);

        $assigned_claims = [];
        foreach ($dates_good as $dates) {
            $date = $dates->format('Y-m-d');
            $next_date = date('Y-m-d', strtotime($date . ' +1 day'));
            $assigned = Claim_history::where('claim_state', 5)->where('assigned_to', $user_id)->where('created_at', '>=', $date)->where('created_at', '<=', $next_date)->count();
            // $assigned=Claim_history::where('claim_state',5)->where('created_at',$date)->get();
            array_push($assigned_claims, $assigned);
        }

        //dd($assigned_claims);

        $daily_records = DB::table("claim_histories")
            //    ->where('claim_state', 3)
            ->whereDate('created_at', '>', Carbon::now()->subDays(7))
            ->groupBy('created_at')
            ->get();


        $assigned_claim_nos = [];
        $worked_claims = [];

        foreach ($daily_records as $records) {
            if ($records->claim_state == 5 && !in_array($records->claim_id, $assigned_claim_nos)) {

                array_push($assigned_claim_nos, $records->claim_id);
                // $assigned=Claim_history::where('claim_state',5)->where('created_at','>=' ,$date)->where('created_at','<=',$next_date)->count();
                // $completed=Claim_history::where('assigned_by',$records['assigned_to'])->where('created_at','>=' ,$date)->where('created_at','<=',$next_date)->count();
            }
        }

        foreach ($assigned_claims as $assigned) {
            $completed = Claim_history::where('assigned_by', $assigned['assigned_to'])->where('created_at', '>=', $date)->count();
        }





        //dd($assigned_claims);
        $current_week = 1;

        // foreach($week_data as $week)
        // {
        //   if (in_array($today, $week))
        //   {
        //       //dd($current_week);
        //   break;
        //   }
        //   else{
        //     $current_week++;
        //   }

        // }

        $weeks = 1;
        $total_per = '';
        $total_target = '';


        //dd($dates);
        return response()->json([
            // 'user' =>$user_id,
            'weeks' => $weeks,
            // 'days'=>$prod_data,
            'ach_per' => $total_per,
            'target' => $total_target
        ]);
    }
}
