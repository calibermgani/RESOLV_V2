<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\Address_flag;
use App\Models\Practice;
use App\Models\Profile;
use App\Models\Role;
use App\Models\User;
use App\Models\User_work_profile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class Userregister extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['getroles', 'register', 'validateusername', 'get_users_list', 'update_user_details', 'getPracticesList', 'get_user_role']]);
    }


    public function getroles()
    {
        // dd('Later working');
        /*
try {*/

        // $roles = Role::where('status', 'Active')->get();
        // dd(Role::where('status', 'Active')->get());
        $roles = \DB::table('roles')->where('status', 'Active')->get();

        // dd('sss',$roles);
        // $factory = JWTFactory::customClaims([
        //     'sub'   => $roles,
        // ]);
        // $payload = $factory->make();
        // $token = JWTAuth::encode($payload);

        // Must Activate the JWT once the Issue is Sorted.-**-*-*--



        /*$payload = JWTFactory::make($roles);
$token = JWTAuth::encode($payload);*/

        /*    if (! $token = JWTAuth::authenticate( $roles )) {
                return response()->json(['error' => 'invalid_credentials','token' => $token], 401);
            }
        } catch (JWTException $e) {

        }*/

        return $this->respondWithToken2($roles);
    }


    public function get_user_role()
    {
        // dd('hi Later work');
        /*
try {*/

        // $roles = Role::get();

        // $factory = JWTFactory::customClaims([
        //     'sub'   => $roles,
        // ]);
        // $payload = $factory->make();
        // $token = JWTAuth::encode($payload);

        // Must Activate the JWT once the Issue is Sorted.-**-*-*--



        /*$payload = JWTFactory::make($roles);
$token = JWTAuth::encode($payload);*/

        /*    if (! $token = JWTAuth::authenticate( $roles )) {
                return response()->json(['error' => 'invalid_credentials','token' => $token], 401);
            }
        } catch (JWTException $e) {

        }*/

        // return $this->respondWithToken2($roles);
    }


    public function validateusername(LoginRequest $request)
    {
        $id = $request->get('id');
        if ($id == null) {
            $user = User::where('user_name', $request->get('username'))->first();
            if (!$user) {
                return response()->json(['message' => 'Clear', 'data' => $request]);
            } else {
                return response()->json(['message' => 'User Name Already Registered.']);
            }
        } else {
            $data = $request->get('data');
            $user = User::where('user_name', $data['username'])->where('id', '<>', $id)->first();
            if (!$user) {
                return response()->json(['message' => 'Clear', 'data' => $data]);
            } else {
                return response()->json(['message' => 'User Name Already Registered.']);
            }
        }
    }

    public function register(LoginRequest $request)
    {
        $data = $request->get('form_data');
        // dd($data);
        $process_details = [];

        $user_tab_data = [
            'role_id'           => 1,
            'user_name'         => $data['username'],
            'password'          => bcrypt($data['password']),
            'user_type'         => 'practice',
            'firstname'         => $data['firstname'],
            'lastname'          => $data['lastname'],
            'status'            => 'Active',
            // 'email'             => 'test@123',
            // 'last_login'        => '1000-01-01',
            // 'token'             => '0',
            // 'is_logged_in'      => '0',
            // 'login_attempt'     => '0',
            // 'attempt_updated'   => '1000-01-01',
            // 'updated_at'        => '1994-01-01 00:00:00',
            'created_by'        =>  $request->get('user_id'),
            // 'updated_by'        => '0',
            // 'deleted_at'        => '1994-01-01 00:00:00'
        ];

        //Core DB data Creation
        $user_core = User::on('mysql')->create($user_tab_data);
        $address = Address_flag::create([
            // 'address_company'      => 'usps',
            // 'type'                 => 'users',
            'address_line_1'       => $data['address1'],
            'address_line_2'       => $data['address2'],
            'city'                 => $data['city'],
            'state'                => $data['state'],
            'zip5'                 => $data['zip'],
            'zip4'                 => $data['zip'],
            // 'is_address_match'     => 'Yes',
            // 'updated_at'           => '2018-05-07 00:00:00'
        ]);
        //   $uid = $data['dob'];

        $date = date('Y-m-d', strtotime($data['dob']['day'] . '-' . $data['dob']['month'] . '-' . $data['dob']['year']));

        //   $date=date('Y-m-d',strtotime($uid['endDate']));


        $profile = Profile::create([
            'user_id'              => $user_core['id'],
            // 'employee_code'        => '00',
            'dob'                  => $date,
            // 'gender'               => 'Others',
            'mobile_phone'         => $data['phone'],
            // 'work_phone'           => '0',
            'address_flag_id'      => $address['id'],
            // 'updated_at'           => '2018-05-07 00:00:00',
            'created_by'           =>  $request->get('user_id'),
            // 'updated_by'           => '0',
            // 'deleted_at'           => '2018-05-07 00:00:00'
        ]);

        $process_details = $data['process_details'];

        Log::info(print_r($data['process_details'], true));

        if (sizeOf($data['process_details']) != 0) {

            foreach ($process_details as $process) {

                // For core DB
                $work_profile = User_work_profile::on('mysql2')->create([
                    'user_id'               => $user_core['id'],
                    'practice_id'           => $process['practice_id'],
                    'role_id'               => $process['role_id'],
                    'claim_assign_limit'    => $process['assign_limit'],
                    'caller_benchmark'      => $process['caller_bench'],
                    'created_at'            => date('Y-m-d H:i:s'),
                    'created_by'            => $request->get('user_id')

                ]);
            }

            $dbconnection = new DBConnectionController();
            $dbs = [];

            foreach ($process_details as $process) {
                //Process For practive DB
                if ($process['practice_id'] != null) {

                    //  array_push($dbs,$process['practice_id']);



                    $user_tab_data['role_id'] = $process['role_id'];
                    $user_tab_data['id'] = $user_core['id'];
                    //  $user_tab_data['id']=1;

                    // dd(DB::connection()->getDatabaseName());

                    // array_push($dbs,\DB::connection('name'));

                    // array_push($dbs,$db);
                    // dd(\Config::get('database'),DB::connection()->getDatabaseName());
                    $db =  $dbconnection->connectDB($process['practice_id']);
                    //      $user=User::on('mysql')->create($user_tab_data);

                    //      $work_profile=User_work_profile::on('mysql')->create([
                    //          'user_id'               => $user['id'],
                    //          // 'practice_id'           => $process['practice_id'],
                    //          'role_id'               => $process['role_id'],
                    //          'claim_assign_limit'    => $process['assign_limit'],
                    //          'caller_benchmark'      => $process['caller_bench'],
                    //          'created_at'            => date('Y-m-d H:i:s'),
                    //          'created_by'            => $request->get('user_id')

                    //      ]);
                    // DB::disconnect('mysql');

                    // DB::connection()->getDoctrineConnection()->close();
                    // $dbconnection->disconnectPracticeDB();
                    // \Config::set('database.default','mysql2');
                    // $db=  $dbconnection->connectDB(2);
                    // array_push($dbs,\Config::get('database'));
                    // array_push($dbs,\Config::get('database'));

                    $query = "INSERT INTO `users`(id,role_id,user_name,`password`,user_type,firstname,lastname,`status`,created_by) VALUES ($user_tab_data[id],$user_tab_data[role_id],'$user_tab_data[user_name]','$user_tab_data[password]','$user_tab_data[user_type]','$user_tab_data[firstname]','$user_tab_data[lastname]','$user_tab_data[status]',$user_tab_data[created_by])";
                    $data = DB::select($query, ['mysql']);
                    // array_push($dbs,$data);
                    $date = date('Y-m-d H:i:s');
                    $query_2 = "INSERT INTO `user_work_profiles`(user_id,role_id,claim_assign_limit,caller_benchmark,created_at,created_by) VALUES ($user_core[id], $process[role_id],$process[assign_limit],$process[caller_bench],'$date',$request->get('user_id'))";
                    $data_2 = DB::select($query_2, ['mysql']);
                    //    array_push($dbs,$data_2);
                }
            }
        }
        // \Config::get('database')

        return response()->json([
            'data' => $dbs,
            'error' => 'Registration Successful'
        ]);
    }
    protected function respondWithToken2($token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type'   => 'bearer',
            'error'        => 'Log'
        ]);
    }

    public function get_users_list(LoginRequest $request)
    {

        $roles_active = role::where('status', 'Inactive')->pluck('id');


        $profile = Profile::all();
        $work_profile = User_work_profile::where('status', 'Active')->get();

        $work_profile_id = User_work_profile::where('status', 'Active')->pluck('role_id')->toArray();

        //dd($work_profile_id);
        $i = 0;
        foreach ($profile as $prof) {

            $date_format[0] = (int)date('d', strtotime($prof['dob']));
            $date_format[1] = (int)date('m', strtotime($prof['dob']));
            $date_format[2] = (int)date('Y', strtotime($prof['dob']));

            //    $date= date('m-d-Y',strtotime($prof['dob']));

            $profile[$i]['dob'] = $date_format;
            $i++;
        }


        $user = User::whereIN('role_id', $work_profile_id)->get();

        $address = Address_flag::all();

        return response()->json([
            'data'          => $user,
            'profile'       => $profile,
            'address'       => $address,
            'work_profile'  => $work_profile
        ]);
    }

    public function update_user_details(LoginRequest $request)
    {

        $id = $request->get('id');
        $data = $request->get('data');
        $upd_id = $request->get('update_id');
        //  $wp_stats=$request->get('stats');




        //For Core DB
        User::where('id', $id)->update(array(
            'user_name'         => $data['username'],
            'firstname'         => $data['firstname'],
            'lastname'          => $data['lastname'],
            'updated_by'        => $upd_id,
            'updated_at'        => date('Y-m-d H:i:s')
        ));


        // ----Not IN Use
        //     //  if(is_array($data['dob']))
        //     //  {
        //     //     //  For DOB
        //     //  $uid=$data['dob']['endDate'];
        //     //  //  $uid = $data['dob'];
        //     //   if(strpos($uid, 'T') !== false)
        //     //   {
        //     //       $split = explode("T",$uid);
        //     //       $dob=$split[0];
        //     //       }
        //     //       else
        //     //       {
        //     //           $dob=$uid;
        //     //           }
        //     //  }
        //     //  else{
        //     //      $dob=$data['dob'];
        //     //  }
        //     ---

        $dob = date('Y-m-d', strtotime($data['dob']['day'] . '-' . $data['dob']['month'] . '-' . $data['dob']['year']));

        $profile = Profile::where('user_id', $id)->update(array(
            'mobile_phone'         => $data['phone'],
            'dob'                  => $dob,
            'updated_by'           => $upd_id,
            'updated_at'           => date('Y-m-d H:i:s')
        ));
        $profile = Profile::where('user_id', $id)->first();
        Address_flag::where('id', $profile['address_flag_id'])->update(array(
            'address_line_1'       => $data['address1'],
            'address_line_2'       => $data['address2'],
            'city'                 => $data['city'],
            'state'                => $data['state'],
            'zip5'                 => $data['zip'],
            'zip4'                 => $data['zip'],
            'updated_at'           => date('Y-m-d H:i:s')
        ));

        $process_details = $data['process_details'];

        $existingPractices = User_work_profile::where('user_id', $id)->pluck('id')->toArray();
        //  $existingPractices=(array)$existingPractices;
        $processed = [];
        foreach ($process_details as $process) {
            $check_existing = User_work_profile::where('id', $process['upd_id'])->where('user_id', $id)->first();

            if ($check_existing != null) {
                if (sizeOf($process) > 1) {
                    $work = User_work_profile::where('id', $process['upd_id'])->update(array(
                        'practice_id'           => $process['practice_id'],
                        'role_id'               => $process['role_id'],
                        'claim_assign_limit'    => $process['assign_limit'],
                        'caller_benchmark'      => $process['caller_bench'],
                        'updated_at'           => date('Y-m-d H:i:s'),
                        'updated_by'           => $upd_id
                    ));
                    array_push($processed, $process['upd_id']);
                } else {
                    array_push($processed, $process['upd_id']);
                }
            } else {
                $work_profile = User_work_profile::create([
                    'user_id'               => $id,
                    'practice_id'           => $process['practice_id'],
                    'role_id'               => $process['role_id'],
                    'claim_assign_limit'    => $process['assign_limit'],
                    'caller_benchmark'      => $process['caller_bench'],
                    'created_at'            => date('Y-m-d H:i:s'),
                    'created_by'            => $upd_id

                ]);

                array_push($processed, $work_profile['id']);
            }
        }

        //Make Deleted Practice Inactive

        $inactive = array_diff($existingPractices, $processed);
        if ($inactive != []) {
            User_work_profile::whereIN('id', $inactive)
                ->update(['status' => 'Inactive']);
        }
        //For Practice DBS


        $user_data = $data;
        $dbconnection = new DBConnectionController();
        $dbs = [];

        foreach ($process_details as $process) {
            $db =  $dbconnection->connectDB($process['practice_id']);

            $query = "SELECT * FROM users WHERE `users`.`id` = $id; ";
            $checkExists = DB::select($query, ['mysql']);

            // if(sizeOf($checkExists) > 1)
            // {
            //     dd($checkExists);
            // }


            if (sizeOf($checkExists) >= 1) {
                $date = date('Y-m-d H:i:s');
                //For User
                $query = "UPDATE `users` SET `user_name`='$user_data[username]',`role_id` = '$process[role_id]',`firstname`='$user_data[firstname]',`lastname`='$user_data[lastname]',`updated_by`=$upd_id,`updated_at` = '$date' WHERE `users`.`id` = $id;";
                $data = DB::select($query, ['mysql']);

                //For Practice
                $query = "UPDATE `user_work_profiles` SET `role_id`='$process[role_id]',`claim_assign_limit`=$process[assign_limit],`caller_benchmark` = '$process[caller_bench]',`updated_at` = '$date',`updated_by` = '$upd_id' WHERE `user_work_profiles`.`id` = $process[upd_id];";
                $data = DB::select($query, ['mysql']);
            } else {
                $query = "INSERT INTO `users`(id,role_id,user_name,`password`,user_type,firstname,lastname,`status`,created_by) VALUES ($id,$process[role_id],'$user_data[username]','JUNiQl3mWRm2SSw00Zx0L','Practice','$user_data[firstname]','$user_data[lastname]','Active',$upd_id)";
                $data = DB::select($query, ['mysql']);
                // array_push($dbs,$data);
                $date = date('Y-m-d H:i:s');
                $query_2 = "INSERT INTO `user_work_profiles`(user_id,role_id,claim_assign_limit,caller_benchmark,created_at,created_by) VALUES ($id, $process[role_id],$process[assign_limit],$process[caller_bench],'$date',$upd_id)";
                $data_2 = DB::select($query_2, ['mysql']);
            }
        }


        return response()->json([
            'data' => $dob
        ]);
    }

    public function getPracticesList()
    {
        $practice = Practice::all();
        return response()->json([
            'data' => $practice
        ]);
    }
}
