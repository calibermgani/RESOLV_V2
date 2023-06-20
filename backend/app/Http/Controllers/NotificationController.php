<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\Import_field;
use App\Models\User;
use App\Models\Workorder_field;
use App\Models\Workorder_user_field;
use Carbon\Carbon;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['get_work_order_details']]);
    }

    function get_work_order_details(LoginRequest $request)
    {
        $data = $request->get('user_id');

        $user = User::where('id', $data)->first();

        // $user=User_work_profile::where('user_id', $data)->orderBy('id', 'desc')->first();

        $deadline_nos = 0;
        $new = 0;


        if ($user != null) {

            //Get values according to the Type
            if ($user['role_id'] == 5 || $user['role_id'] == 2 || $user['role_id'] == 3) {
                $work_order_list = Workorder_field::whereIn('status', ['Assigned', 'InProgress'])->whereDate('due_date', '<', Carbon::now()->format('Y-m-d'))->get()->toArray();

                $new_wo = Import_field::where('assigned_to', NULL)->where('audit_work_order', 0)->where('ca_work_order', 0)->where('rcm_work_order', 0)->count();
            } else if ($user['role_id'] == 1) {
                $work_order_list = Workorder_field::where('work_order_type', 1)->whereIn('status', ['Assigned', 'InProgress'])->whereDate('due_date', '<', Carbon::now()->format('Y-m-d'))->get()->toArray();

                $new_wo = Workorder_field::whereIn('status', ['Assigned', 'InProgress'])->whereDate('due_date', '>', Carbon::now()->format('Y-m-d'))->get()->toArray();

                // $new = Import_field::where('assigned_to',NULL)->where('audit_work_order',0)->where('ca_work_order',0)->where('rcm_work_order',0)->count();


            } else if ($user['role_id'] == 4) {
                $work_order_list = Workorder_field::where('work_order_type', 2)->whereIn('status', ['Assigned', 'InProgress'])->whereDate('due_date', '<', Carbon::now()->format('Y-m-d'))->get()->toArray();
            } else if ($user['role_id'] == 6) {
                $work_order_list = Workorder_field::where('work_order_type', 3)->whereIn('status', ['Assigned', 'InProgress'])->whereDate('due_date', '<', Carbon::now()->format('Y-m-d'))->get()->toArray();
            } else if ($user['role_id'] == 7) {
                $work_order_list = Workorder_field::where('work_order_type', 4)->whereIn('status', ['Assigned', 'InProgress'])->whereDate('due_date', '<', Carbon::now()->format('Y-m-d'))->get()->toArray();
            }


            $i = 0;
            foreach ($work_order_list as $work) {
                $work_user = Workorder_user_field::where('work_order_id', $work['id'])->get()->toArray();
                $j = 0;
                $unfin_user = [];
                foreach ($work_user as $wo_user) {
                    $claims_pending = json_decode($wo_user['cliam_no']);
                    if (sizeOf($claims_pending) != 0) {
                        array_push($unfin_user, $wo_user['user_id']);
                    }
                }
                $work_order_list[$i]['incomplete'] = $unfin_user;
                $i++;
            }
        } else {
            $work_order_list = 0;
            $deadline_nos = 0;
        }

        // foreach($new_wo as $wo)
        // {
        //     $work_user=Workorder_user_field::where('work_order_id', $wo['id'])->get()->toArray();

        // }




        $new = 0;

        return response()->json([
            'data' => $work_order_list,
            'deadline' => $deadline_nos,
            'new'      => 20
        ]);
    }
}
