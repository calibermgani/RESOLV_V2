<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\Error_type;
use App\Models\ErrorParameter;
use App\Models\Followup_category;
use App\Models\Followup_question;
use App\Models\FYIParameter;
use App\Models\Import_field;
use App\Models\Root_cause;
use App\Models\Statuscode;
use App\Models\Sub_statuscode;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class SettingsController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['getfields', 'setsetting', 'create_category', 'get_category', 'create_questions', 'update_category', 'update_questions', 'create_statuscode', 'get_status_codes', 'create_substatus_code', 'update_status_code', 'get_root_cause', 'create_root_cause', 'get_error_type', 'create_error_type', 'update_prac_settings', 'get_practice_stats', 'get_settingsearch', 'create_error_parameters', 'create_fyi_parameters']]);
    }

    /*Get the Field Names and Previous Settings*/
    public function getfields(LoginRequest $request)
    {
        $searchValue = $request->get('searchValue');
        $practice_dbid = $request->get('practice_dbid');
        $result = Config::get('fields.data');
        $index = array_keys($result);


        // if($searchValue != 'null'){
        //     $input = preg_quote($searchValue, '~');
        //     $index = preg_grep('~' . $input . '~', $index);
        // }



        $name_result_dest = base_path('config/test/fields_name.txt');

        // $name_result = array_keys($name_result);
        // $name_result_dest = public_path('../config/fields.txt');

        if (!file_exists($name_result_dest)) {
            $name_result = "Its Empty";
        } else {
            if ($searchValue != 'null') {
                $name_result = json_decode(file_get_contents($name_result_dest), true);
                //$input = preg_quote(ucwords($searchValue), '~');
                $name_result = preg_grep("/" . $searchValue . "/i", $name_result);

                if (!empty($name_result)) {
                    foreach ($name_result as $key => $value) {
                        foreach ($result as $value) {
                            if ($value == $key) {
                                $test[] =  $value;
                            }
                        }
                    }
                } else {
                    $test =  [];
                }
            } else {
                $name_result = json_decode(file_get_contents($name_result_dest), true);
            }

            // dd($name_result);
        }

        // $name_result=json_decode($name_result);
        $destinationPath = public_path('../config/test/' . $practice_dbid . 'test.txt');
        if (!file_exists($destinationPath)) {
            $jsondec = null;
        } else {
            $jsondec = json_decode(file_get_contents($destinationPath), true);
        }

        if ($searchValue != 'null') {
            return response()->json([
                'message' => $test,
                'data'   => $jsondec,
                'name'   => $name_result,
                'error'  => "Upload Complete"
            ]);
        } else {

            return response()->json([
                'message' => $index,
                'data'   => $jsondec,
                'name'   => $name_result,
                'error'  => "Upload Complete"
            ]);
        }
    }

    /*Save User Setting */
    public function setsetting(LoginRequest $request)
    {
        $data = $request->get('set');
        $practice_dbid = $request->get('practice_dbid');
        $file = $practice_dbid . 'test.txt';

        $destinationPath = base_path('config/test/');
        //File::delete('../config/test/'.'test.txt');
        $keys_arr = array_keys($data);
        $okey = "nil";
        $content = [];
        foreach ($keys_arr as $keys) {
            $exp = strpos($keys, '_option');
            if (strpos($keys, '_option') == false) {
                if ($data[$keys] != false) {
                    $content[$keys] = [$data[$keys], $data[$keys . "_option"]];
                    $okey = $keys;
                }
            }
        }
        $data_encoded = json_encode($content);
        if (!file_exists($destinationPath)) {
            // path does not exist
            $exist = "nope";
            File::makeDirectory($destinationPath, $mode = 0777, true, true);
        } else {
            $exist = "yes";
        }
        $decoded = File::put($destinationPath . $file, $data_encoded);
        return response()->json([
            'message' => $content,
            'error' => "Settings Set"
        ]);
    }

    //Create New Category
    public function create_category(LoginRequest $request)
    {
        $data = $request->get('data');
        $id = $request->get('id');
        $questions = null;
        $insert = Followup_category::create([
            'name'         => $data['category_name'],
            'label_name'   => $data['label_name'],
            'status'       => $data['status'],
            'created_by'   => $id
        ]);
        $category = Followup_category::all();
        $questions_data = Followup_question::all();
        foreach ($category as $cat) {
            $i = 0;
            $question = [];
            $question = Followup_question::where('category_id', $cat['id'])->get();
            $questions[$cat['id']] = $question;
        }
        return response()->json([
            'data' => $insert,
            'message' => "Created"
        ]);
    }

    //Update Category
    public function update_category(LoginRequest $request)
    {
        $data = $request->get('data');
        $id = $request->get('id');
        $upd_id = $request->get('upd_id');
        $questions = null;
        DB::table('followup_categories')->where('id', $upd_id)->update(array(
            'name'          => $data['category_name'],
            'label_name'    => $data['label_name'],
            'status'        => $data['status'],
            'updated_by'    => $id
        ));
        $category = Followup_category::all();
        $questions_data = Followup_question::all();
        foreach ($category as $cat) {
            $i = 0;
            $question = [];
            $question = Followup_question::where('category_id', $cat['id'])->get();


            foreach ($question as $key => $value) {
                $assigned_to = User::where('id', $value['created_by'])->first();

                $question[$key]['creator'] = $assigned_to['firstname'];
            }
            //  dd($question);

            $questions[$cat['id']] = $question;
        }
        return response()->json([
            'data' => $category,
            'quest' => $questions
        ]);
    }

    public function get_category(LoginRequest $request)
    {
        $id = $request->get('id');
        //dd($id);
        $category = Followup_category::all();
        $questions_data = Followup_question::all();
        //dd($questions_data);
        foreach ($category as $cat) {
            $i = 0;
            $question = [];
            if (isset($question)) {
                $question = Followup_question::where('category_id', $cat['id'])->get();
                foreach ($question as $key => $value) {
                    $assigned_to = User::where('id', $value['created_by'])->first();

                    $question[$key]['creator'] = $assigned_to['firstname'];
                }
                $questions[$cat['id']] = $question;
            }
        }

        $category_count = count($category);

        if ($category_count == 0) {
            return response()->json(['data' => $category, 'count' => 0]);
        } else {
            return response()->json(['data' => $category, 'quest' => $questions, 'count' => 1]);
        }
    }

    public function create_questions(LoginRequest $request)
    {
        $data = $request->get('data');
        $category = $request->get('cat_id');
        $id = $request->get('user_id');
        $date_type = null;
        $field_validation = null;
        $questions = null;
        if ($data['field_type'] == 'Date') {
            $date_type = $data['date_type'];
        } else {
            $field_validation = $data['field_validation'];
        }
        $insert = Followup_question::create(
            [
                'question'           => $data['question'],
                'question_label'     => preg_replace('/[^a-zA-Z0-9-_\.]/', '_', $data['question']),
                'hint'               => $data['hint'],
                'category_id'        => $category,
                'field_type'         => $data['field_type'],
                'field_validation'   => $field_validation,
                'date_type'          => $date_type,
                'status'             => $data['status'],
                'created_by'         => $id
            ]
        );
        $category = Followup_category::all();
        foreach ($category as $cat) {
            $i = 0;
            $question = [];
            $question = Followup_question::where('category_id', $cat['id'])->get();
            $questions[$cat['id']] = $question;
        }
        return response()->json([
            'data' => $questions,
        ]);
    }

    public function update_questions(LoginRequest $request)
    {
        $data = $request->get('data');
        $update_id = $request->get('upd_id');
        $id = $request->get('user_id');
        $date_type = null;
        $field_validation = null;
        $questions = null;
        if ($data['field_type'] == 'Date') {
            if ($data['date_type'] == 'Single Date') {
                $date_type = 'single_date';
            } else {
                $date_type = 'double_date';
            }
        } else {
            $field_validation = $data['field_validation'];
        }
        DB::table('followup_questions')->where('id', $update_id)->update(array(
            'question'          => $data['question'],
            'hint'              => $data['hint'],
            'field_type'        => $data['field_type'],
            'field_validation'  => $field_validation,
            'date_type'         => $date_type,
            'status'            => $data['status']
        ));
        $category = Followup_category::all();
        $questions_data = Followup_question::all();
        foreach ($category as $cat) {
            $i = 0;
            $question = [];
            $question = Followup_question::where('category_id', $cat['id'])->get();

            foreach ($question as $key => $value) {
                $assigned_to = User::where('id', $value['created_by'])->first();

                $question[$key]['creator'] = $assigned_to['firstname'];
            }

            $questions[$cat['id']] = $question;
        }
        return response()->json([
            'data' => $questions,

        ]);
    }


    public function create_statuscode(LoginRequest $request)
    {
        $data = $request->get('data');
        $id = $request->get('id');

        $module['followup'] = $data['foll_chk'];
        $module['audit'] = $data['aud_chk'];
        $module['ca'] = $data['ca_chk'];
        $module['rcm'] = $data['rcm_chk'];

        $encoded = json_encode($module);

        $create_status = Statuscode::create(
            [
                'status_code'      => $data['status_code'],
                'description'      => $data['state_name'],
                'status'           => $data['state_status'],
                'created_by'       => $id,
                'modules'          => $encoded
            ]
        );
        // $status=Statuscode::all();

        // foreach($status as $stat)
        // {
        //     $i=0;
        //     $substatus=[];
        //     $substatus=Sub_statuscode::where('parent_status_id', $stat['id'])->get();
        //     $sub_status[$stat['id']]=$substatus;
        //     }
        $status_code = $this->fetch_codes();

        return response()->json([
            'status'     => $status_code['status'],
            'sub_status' => $status_code['sub_status']
        ]);
    }

    public function create_substatus_code(LoginRequest $request)
    {
        $data = $request->get('data');
        $id = $request->get('id');
        $status_id = $request->get('status');

        $module['followup'] = $data['foll_chk'];
        $module['audit'] = $data['aud_chk'];
        $module['ca'] = $data['ca_chk'];
        $module['rcm'] = $data['rcm_chk'];

        $encoded = json_encode($module);

        $create_status = Sub_statuscode::create(
            [
                'status_code'        => $data['status_code'],
                'parent_status_id'   => $status_id,
                'description'        => $data['state_name'],
                'status'             => $data['state_status'],
                'created_by'         => $id,
                'modules'            => $encoded
            ]
        );


        //         $status=Statuscode::all();

        // foreach($status as $stat)
        // {
        //     $i=0;
        //     $substatus=[];
        //     $substatus=Sub_statuscode::where('parent_status_id', $stat['id'])->get();
        //     $sub_status[$stat['id']]=$substatus;
        //     }


        $status_code = $this->fetch_codes();

        return response()->json([
            'status'     => $status_code['status'],
            'sub_status' => $status_code['sub_status']
        ]);
    }




    public function update_status_code(LoginRequest $request)
    {
        $data = $request->get('upd_data');
        $update_id = $request->get('upd_id');
        $id = $request->get('user_id');
        $type = $request->get('type');

        $module['followup'] = $data['foll_chk'];
        $module['audit'] = $data['aud_chk'];
        $module['ca'] = $data['ca_chk'];
        $module['rcm'] = $data['rcm_chk'];

        $encoded = json_encode($module);


        if ($type == 'statuscode') {
            DB::table('status')->where('id', $update_id)->update(array(
                'description'          => $data['state_name'],
                'status_code'          => $data['status_code'],
                'status'               => $data['state_status'],
                'updated_by'           => $id,
                'modules'              => $encoded
            ));
        } else if ($type == 'sub_statuscode') {
            DB::table('sub_status')->where('id', $update_id)->update(array(
                'description'          => $data['state_name'],
                'status_code'          => $data['status_code'],
                'status'               => $data['state_status'],
                'updated_by'           => $id,
                'modules'              => $encoded
            ));
        }

        // $status=Statuscode::all();

        // foreach($status as $stat)
        // {
        //     $i=0;
        //     $substatus=[];
        //     $substatus=Sub_statuscode::where('parent_status_id', $stat['id'])->get();
        //     $sub_status[$stat['id']]=$substatus;
        //     }


        //         return response()->json([
        //             'status'     => $status,
        //             'sub_status' => $sub_status
        //                      ]);

        $status_code = $this->fetch_codes();

        return response()->json([
            'status'     => $status_code['status'],
            'sub_status' => $status_code['sub_status']
        ]);
    }


    public function fetch_codes()
    {
        $status = Statuscode::all();
        $i = 0;
        $sub_status = [];
        foreach ($status as $stat) {

            $substatus = [];
            $substatus = Sub_statuscode::where('parent_status_id', $stat['id'])->get();
            $j = 0;
            foreach ($substatus as $sub_stat) {
                $sub_decode = json_decode($sub_stat['modules']);

                $substatus[$j]['modules'] =  $sub_decode;
                $j++;
            }

            $sub_status[$stat['id']] = $substatus;

            $decode = json_decode($stat['modules']);

            // $status[$i]['followup'] = $decode['followup'];
            // $status[$i]['audit'] = $decode['audit'];
            // $status[$i]['ca'] = $decode['ca'];
            // $status[$i]['rcm'] = $decode['rcm'];
            $status[$i]['modules'] = $decode;


            $i++;
        }

        $status_code = array(
            'status' => $status,
            'sub_status' => $sub_status,
        );


        // $status_code['status']     =  $status;
        // $status_codes['sub_status'] =  $sub_status;

        return $status_code;
    }

    public function get_status_codes(LoginRequest $request)
    {
        $id = $request->get('id');
        $claim_no = $request->get('claim');
        $module = $request->get('module');
        $type = null;
        // $status=Statuscode::all();
        // $sub_status=[];
        // foreach($status as $stat)
        // {
        //     $i=0;
        //     $substatus=[];
        //     $substatus=Sub_statuscode::where('parent_status_id', $stat['id'])->get();
        //     $sub_status[$stat['id']]=$substatus;
        //     }
        $status_code = $this->fetch_codes();
        //dd($status_code);
        $claim_status = Import_field::where('claim_no', $claim_no)->get();

        $op_status = [];

        foreach ($status_code['status'] as $stat) {

            $module_all = $stat['modules'];
            if ($module == 'all') {
                array_push($op_status, $stat);
                $type = "all";
            } else if ($module == '/followup') {
                $type = "fl";
                if ($module_all->{'followup'} == true) {
                    array_push($op_status, $stat);
                }
            } else if ($module == '/audit') {
                $type = "au";
                if ($module_all->{'audit'} == true) {
                    array_push($op_status, $stat);
                }
            } else if ($module == '/client_assistance') {
                $type = "ca";
                if ($module_all->{'ca'} == true) {
                    array_push($op_status, $stat);
                }
            } else if ($module == '/rcm') {
                $type = "rcm";
                if ($module_all->{'rcm'} == true) {
                    array_push($op_status, $stat);
                }
            } else if ($module == '/claims') {
                $type = "claims";
                if ($module_all->{'audit'} == true) {
                    array_push($op_status, $stat);
                }
            }
        }

        //dd($op_status);


        return response()->json([
            'status'     => $op_status,
            'sub_status' => $status_code['sub_status'],
            'claim_status' => $claim_status,
            'type'          => $type
        ]);
    }


    public function get_root_cause(LoginRequest $request)
    {
        $id = $request->get('id');
        $root_states = Root_cause::all();

        return response()->json([
            'states'     => $root_states
        ]);
    }

    public function create_root_cause(LoginRequest $request)
    {
        $data = $request->get('form_data');
        $id = $request->get('id');
        $type = $request->get('type');

        if ($type == 'create') {
            $create_status = Root_cause::create(
                [
                    'name'      => $data['name'],
                    'status'      => $data['status'],
                    'created_by'       => $id
                ]
            );
        } else if ($type == 'update') {


            DB::table('root_causes')->where('id', $id['upd_id'])->update(array(
                'name'        => $data['name'],
                'status'      => $data['status'],
                'updated_at'  => date('Y-m-d H:i:s'),
                'updated_by'  => $id['user']
            ));
        }


        $root_states = Root_cause::all();
        return response()->json([
            'states'     => $root_states
        ]);
    }

    public function get_error_type(LoginRequest $request)
    {
        $id = $request->get('id');
        $error_type = Error_type::all();

        return response()->json([
            'states'     => $error_type
        ]);
    }

    public function create_error_type(LoginRequest $request)
    {
        $data = $request->get('form_data');
        $id = $request->get('id');
        $type = $request->get('type');

        if ($type == 'create') {
            $create_status = Error_type::create(
                [
                    'name'      => $data['name'],
                    'status'      => $data['status'],
                    'created_by'       => $id
                ]
            );
        } else if ($type == 'update') {


            DB::table('error_types')->where('id', $id['upd_id'])->update(array(
                'name'        => $data['name'],
                'status'      => $data['status'],
                'updated_at'  => date('Y-m-d H:i:s'),
                'updated_by'  => $id['user']
            ));
        }


        $root_states = Error_type::all();
        return response()->json([
            'states'     => $root_states
        ]);
    }

    public function get_practice_stats(LoginRequest $request)
    {
        $destinationPath = public_path('../config/practice_settings.txt');
        if (File::exists($destinationPath)) {
            $jsondec = json_decode(file_get_contents($destinationPath), true);
        } else {
            $jsondec = [];
        }


        return response()->json([
            'data'     => $jsondec
        ]);
    }

    public function update_prac_settings(LoginRequest $request)
    {
        $data = $request->get('form_data');
        $user_id = $request->get('user_id');

        $destinationPath = public_path('../config/practice_settings.txt');
        $jsondec = json_decode(file_get_contents($destinationPath), true);

        $jsondec['touch_limit'] = $data['touch_limit'];
        $data_encoded = json_encode($jsondec);
        $decoded = File::put($destinationPath, $data_encoded);

        return response()->json([
            'data'     => $decoded
        ]);
    }

    // public function get_settingsearch(LoginRequest $request){

    //     $data = $request->get('searchValue');

    //     $search_data = User::where('name', 'LIKE', "%{$searchTerm}%")->get();


    //     return response()->json([
    //         'data' => $search_data
    //         ]);

    // }

    /** Developer: Sathish
     *  Purposer : To Create and Update Error Parameter
     *  Date : 04/01/2023
     */

    public function create_error_parameters(LoginRequest $request)
    {
        $data = $request->get('form_data');
        $id = $request->get('id');
        $type = $request->get('type');

        if ($type == 'create') {
            $create_status = ErrorParameter::create(
                [
                    'error_parameter'       => $data['error_parameter'],
                    'error_sub_parameter'   => $data['error_sub_parameter'],
                    'status'                => $data['status'],
                    'created_by'            => $id
                ]
            );
        } else if ($type == 'update') {
            DB::table('error_parameters')->where('id', $id['upd_id'])->update(array(
                'error_parameter'       => $data['error_parameter'],
                'error_sub_parameter'   => $data['error_sub_parameter'],
                'updated_at'            => date('Y-m-d H:i:s'),
                'updated_by'            => $id['user']
            ));
        }
        $root_states = ErrorParameter::all();
        return response()->json(['states'   => $root_states]);
    }

    /** Developer: Sathish
     *  Purposer : To Create and Update FYI Parameter
     *  Date : 04/01/2023
     */

    public function create_fyi_parameters(LoginRequest $request)
    {
        $data = $request->get('form_data');
        $id = $request->get('id');
        $type = $request->get('type');

        if ($type == 'create') {
            $create_status = FYIParameter::create(
                [
                    'fyi_parameter'     => $data['fyi_parameter'],
                    'fyi_sub_parameter' => $data['fyi_sub_parameter'],
                    'status'            => $data['status'],
                    'created_by'        => $id
                ]
            );
        } else if ($type == 'update') {
            DB::table('f_y_i_parameters')->where('id', $id['upd_id'])->update(array(
                'fyi_parameter'     => $data['fyi_parameter'],
                'fyi_sub_parameter' => $data['fyi_sub_parameter'],
                'status'      => $data['status'],
                'updated_at'  => date('Y-m-d H:i:s'),
                'updated_by'  => $id['user']
            ));
        }
        $root_states = FYIParameter::all();
        return response()->json(['states'   => $root_states]);
    }
}
