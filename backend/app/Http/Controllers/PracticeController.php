<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApiRequest;
use App\Models\Import_field;
use App\Models\Practice;
use App\Models\Role;
use App\Models\User;
use App\Models\User_work_profile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;

class PracticeController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['createpractice', 'getPractices', 'selectPractice']]);
    }

    public function createpractice(ApiRequest $request)
    {
        $data = $request->get('data');


        $dbconnection = new DBConnectionController();
        $db_name = strtolower($data['practice_name']);
        $dbconnection->createSchema($db_name);


        $user = Practice::create([
            'practice_name'                => $data['practice_name'],
            'practice_description'         => @$data['practice_desc'],
            'email'                        => $data['email'],
            'phone'                        => @$data['phone_no'],
            'fax'                          => @$data['fax_no'],
            'avatar_name'                  => @$data['avatar_name'],
            'practice_link'                => @$data['practice_link'],
            'doing_business_as'            => @$data['business_name'],
            'speciality_id'                => @$data['spec'],
            'taxanomy_id'                  => @$data['taxonomy'],
            'billing_entity'               => 'Yes',
            'entity_type'                  => @$data['entity_type'],
            'tax_id'                       => @$data['tax_id'],
            'group_tax_id'                 => @$data['tax_id'],
            'npi'                          => @$data['npi'],
            'group_npi'                    => @$data['medicare_id2'],
            'medicare_ptan'                => @$data['medicare_ptan'],
            'medicaid'                     => @$data['medicare_id'],
            'mail_add_1'                   => @$data['mail_address_1'],
            'mail_add_2'                   => @$data['mail_address_2'],
            'mail_city'                    => @$data['mail_city'],
            'mail_state'                   => @$data['mail_state'],
            'mail_zip5'                    => @$data['mail_zip'],
            'mail_zip4'                    => @$data['mail_zip'],
            'primary_add_1'                => @$data['prim_address1'],
            'primary_add_2'                => @$data['prim_address2'],
            'primary_city'                 => @$data['prim_city'],
            'primary_state'                => @$data['prim_state'],
            'primary_zip5'                 => @$data['prim_zip_code'],
            'primary_zip4'                 => @$data['prim_zip_code'],
            'practice_db_id'               => @$db_name,
            'status'                       => 'Active',
            'created_by'                   => $request->get('uid')
        ]);

        return response()->json([
            'data' => $dbconnection, 'status' => 'success'
        ]);
    }

    public function getPractices(ApiRequest $request)
    {

        $practice_list = [];
        $user_id = $request->get('user');
        $user = User::where('id', $user_id)->pluck('role_id');
        //$user_role = Role::where('id',1)->first();

        $user_role =  DB::table("roles")->where('id',$user)->first();

        if ($user_role->role_name == 'Administrator') {
            $practice_list = Practice::all();
        } else {

            $practice_assigned = User_work_profile::where('user_id', $user_id)->get();

            foreach ($practice_assigned as $practice) {

                if(isset($practice['practice_id'])){
                $practice_data = Practice::where('id', $practice['practice_id'])->get();

                $practiceDbConnection = new DBConnectionController();
                $practiceDbConnection->connectDB($practice['practice_id']);

                $totalCount =  Import_field::count();
                $assignedClaims = Import_field::where('claim_Status', 'Assigned')->count();
                $unaAssignedClaims = Import_field::where('claim_Status', Null)->count();
                $auditClaims = Import_field::where('claim_Status', 'Audit')->orWhere('claim_Status', 'Auditing')->where('claim_closing', '<>', 1)->count();
                $closedClaims = Import_field::where('claim_closing', 1)->orWhere('claim_Status', 'Closed')->count();

                $practice_data['total_count'] = $totalCount;
                $practice_data['assigned_count'] = $assignedClaims;
                $practice_data['unassigned_count'] = $unaAssignedClaims;
                $practice_data['audit_count'] = $auditClaims;
                $practice_data['closed_count'] = $closedClaims;

                if ($practice_data != null) {
                    array_push($practice_list, $practice_data[0]);
                }

            }



            }
        }


        //Practice Calculation done Here

        return response()->json([
            'data' => $practice_list,
        ]);
    }

    public function selectPractice(ApiRequest $request)
    {

        $user_id = $request->get('user_id');
        $practice = $request->get('prac_id');

        $practice_data = Practice::where('id', $practice)->first();

        $dbconnection = new DBConnectionController();
        $practice_assigned = User_work_profile::where('user_id', $user_id)->where('practice_id', $practice)->pluck('role_id');

        // $dbconnection->configureConnectionByName($practice_data['id']);

        $session = Session::put('practice_dbid', $practice_data['id']);
        $practice_name_session = Session::put('curr_practice_name', $practice_data['practice_name']);

        return response()->json([
            'data' => Session::get('practice_dbid'),
            'practice_name' => Session::get('curr_practice_name'),
            'role' => $practice_assigned
        ]);
    }
}
