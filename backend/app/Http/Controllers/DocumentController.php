<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\Document;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['doc_name_validity', 'upload_file', 'get_document_list', 'download_doc_file', 'delete_doc_file', 'view_doc_file']]);
    }


    public function doc_name_validity(LoginRequest $request)
    {
        $doc_name = $request->get('name');
        $val_type = $request->get('check_type');

        if ($val_type == "new") {
            $valid = Document::where('document_name', $doc_name)->where('deleted_at', null)->count();
        } else {
            $id = $request->get('id');
            $valid = Document::where('document_name', $doc_name)->where('deleted_at', null)->whereNotIn('id', [$id])->count();
        }




        if ($valid == 0) {
            $valid = true;
        } else {
            $valid = false;
        }
        return response()->json([
            'data' => $valid
        ]);
    }

    public function upload_file(LoginRequest $request)
    {
        $file_nos = $request->get('file_nos');
        $path = "../storage/documents";
        // $path="../config/test/";
        $doc_file_names = [];
        $enc_file_names = [];

        $upload_type = $request->get('type');

        //dd($upload_type);
        if ($upload_type == 'update') {
            $update_id = $request->get('upd_id');

            $list = Document::where('id', $update_id)->get();

            $doc_file_names = json_decode($list[0]['file_name']);
            $enc_file_names = json_decode($list[0]['uploaded_name']);
        }

        for ($i = 0; $i < $file_nos; $i++) {
            $file_get = 'file' . $i;
            $savedata = $request->file($file_get);
            $file_name = $request->file($file_get)->getClientOriginalName();
            $file_ext = $request->file($file_get)->getClientOriginalExtension();

            $enc_file_name = md5($file_name . microtime());
            //dd($enc_file_name);

            array_push($doc_file_names, $file_name);
            array_push($enc_file_names, $enc_file_name . "." . $file_ext);

            $savedata->move($path, $enc_file_name . "." . $file_ext);
            // $file = Storage::disk('google')->$savedata ;
            //dd($path);
            $dest_file = $path . '/' . $enc_file_name . "." . $file_ext;

            $store_file_val = file_get_contents($dest_file);
            Storage::disk('google')->put($enc_file_name . "." . $file_ext,  $store_file_val);
            //dd($store_file_val);

            File::delete($dest_file);
        }

        // $file_name = $request->file('file')->getClientOriginalName();
        $doc_name = $request->get('doc_name');
        $doc_category = $request->get('doc_category');
        // $doc_exet= $request->get('doc_exet');
        $user = $request->get('user');
        $json_original = json_encode($doc_file_names);
        $json_encoded = json_encode($enc_file_names);
        // $filename=date('Y-m-d').'_'.$filename;

        //     $savedata->move($path,$doc_name.".".$doc_exet);
        if ($upload_type == 'upload') {
            $document_upload = Document::create(
                [
                    'document_name'         => $doc_name, //
                    'category'              => $doc_category,
                    'file_name'             => $json_original,
                    'uploaded_name'         => $json_encoded,
                    'created_by'            => $user
                ]
            );
        } elseif ($upload_type == 'update') {
            $update_claim = DB::table('documents')->where('id', $update_id)->update(array(
                'document_name'         => $doc_name,
                'category'              => $doc_category,
                'file_name'             => $json_original,
                'uploaded_name'         => $json_encoded,
                'updated_at'            => now(),
                'updated_by'            => $user
            ));
        }
        $page_no = $request->get('page_no');
        $page_count = $request->get('page_count');

        $list = $this->list_table_data($page_no, $page_count);
        return response()->json([
            'data' => $list
        ]);
    }

    private function list_table_data($page_no, $page_count)
    {
        $total_count = 0;
        $skip = ($page_no - 1) * $page_count;
        $end = $page_count;

        $list = Document::where('deleted_at', null)->offset($skip)->limit($end)->get();
        $list_count = Document::where('deleted_at', null)->count();
        $list = $this->arrange_data($list);
        $op_data = array('data' => $list, 'count' => $list_count);
        return $op_data;
    }

    public function get_document_list(LoginRequest $request)
    {
        $page_no = $request->get('page_no');
        $page_count = $request->get('count');
        $searchValue = $request->get('searchValue');
        $sorting_method = $request->get('sort_by');
        $sort_name = $request->get('sort_name');

        if (!empty($searchValue)) {
            $search_document_name = $searchValue['document_name'];
            $search_created_at = $searchValue['created_at'];
            $search_category = $searchValue['category'];
        }

        $total_count = 0;
        $skip = ($page_no - 1) * $page_count;
        $end = $page_count;



        if (empty($searchValue)) {

            if ($sorting_method == null && $sort_name == null) {
                //dd('dasda');
                $list = Document::where('deleted_at', null)->offset($skip)->limit($end)->get();
                $list_count = Document::where('deleted_at', null)->count();
            } elseif ($sorting_method == true && empty($sort_name)) {
                //dd('dasda');
                $list = Document::where('deleted_at', null)->offset($skip)->limit($end)->get();
                $list_count = Document::where('deleted_at', null)->count();
            } elseif ($sorting_method == false && $sort_name != null) {
                $list = Document::where('deleted_at', null)->orderBy($sort_name, 'desc')->offset($skip)->limit($end)->get();
                $list_count = Document::where('deleted_at', null)->orderBy($sort_name, 'desc')->count();
            } elseif ($sorting_method == true && $sort_name != null) {
                $list = Document::where('deleted_at', null)->orderBy($sort_name, 'asc')->offset($skip)->limit($end)->get();
                $list_count = Document::where('deleted_at', null)->orderBy($sort_name, 'asc')->count();
            }

            $current_total = $list->count();
            $list = $this->arrange_data($list);
            $op_data = array('data' => $list, 'count' => $list_count);
        } elseif (!empty($searchValue)) {
            $list = Document::where('deleted_at', null)->offset($skip)->limit($end);

            $list_count = Document::where('deleted_at', null);

            if (!empty($search_document_name)) {

                if ($sorting_method == null && $sort_name == null) {

                    $list->where('document_name', 'LIKE', '%' . $search_document_name . '%');

                    $list_count->where('document_name', 'LIKE', '%' . $search_document_name . '%');
                } elseif ($sorting_method == false && $sort_name != null) {
                    $list->where('document_name', 'LIKE', '%' . $search_document_name . '%')->orderBy($sort_name, 'desc');

                    $list_count->where('document_name', 'LIKE', '%' . $search_document_name . '%')->orderBy($sort_name, 'desc');
                } elseif ($sorting_method == true && $sort_name != null) {
                    $list->where('document_name', 'LIKE', '%' . $search_document_name . '%')->orderBy($sort_name, 'asc');

                    $list_count->where('document_name', 'LIKE', '%' . $search_document_name . '%')->orderBy($sort_name, 'asc');
                }
            }

            if (!empty($search_created_at) && $search_created_at['startDate'] != null) {
                //dd($search_created_at);
                $sart_date = date('Y-m-d', strtotime($search_created_at['startDate']));
                $end_date = date('Y-m-d', strtotime($search_created_at['endDate']));

                if ($sart_date == $end_date) {
                    $created_at_sart_date = date('Y-m-d', strtotime($search_created_at['startDate'] . "+ 1 day"));
                    $created_at_end_date = date('Y-m-d', strtotime($search_created_at['endDate'] . "+ 1 day"));
                } elseif ($sart_date != $end_date) {
                    $created_at_sart_date = date('Y-m-d', strtotime($search_created_at['startDate'] . "+ 1 day"));
                    $created_at_end_date = date('Y-m-d', strtotime($search_created_at['endDate']));
                }

                if ($sorting_method == null && $sort_name == null) {

                    $list->where(DB::raw('DATE(documents.created_at)'), '>=', $created_at_sart_date)->where(DB::raw('DATE(documents.created_at)'), '<=', $created_at_end_date);

                    $list_count->where(DB::raw('DATE(documents.created_at)'), '>=', $created_at_sart_date)->where(DB::raw('DATE(documents.created_at)'), '<=', $created_at_end_date);
                } elseif ($sorting_method == false && $sort_name != null) {

                    $list->where(DB::raw('DATE(documents.created_at)'), '>=', $created_at_sart_date)->where(DB::raw('DATE(documents.created_at)'), '<=', $created_at_end_date)->orderBy($sort_name, 'desc');

                    $list_count->where(DB::raw('DATE(documents.created_at)'), '>=', $created_at_sart_date)->where(DB::raw('DATE(documents.created_at)'), '<=', $created_at_end_date)->orderBy($sort_name, 'desc');
                } elseif ($sorting_method == true && $sort_name != null) {

                    $list->where(DB::raw('DATE(documents.created_at)'), '>=', $created_at_sart_date)->where(DB::raw('DATE(documents.created_at)'), '<=', $created_at_end_date)->orderBy($sort_name, 'asc');

                    $list_count->where(DB::raw('DATE(documents.created_at)'), '>=', $created_at_sart_date)->where(DB::raw('DATE(documents.created_at)'), '<=', $created_at_end_date)->orderBy($sort_name, 'asc');
                }
            }

            if (!empty($search_category)) {

                if ($sorting_method == null && $sort_name == null) {

                    $list->where('category', 'LIKE', '%' . $search_category . '%');

                    $list_count->where('category', 'LIKE', '%' . $search_category . '%');
                } elseif ($sorting_method == false && $sort_name != null) {
                    $list->where('category', 'LIKE', '%' . $search_category . '%')->orderBy($sort_name, 'desc');

                    $list_count->where('category', 'LIKE', '%' . $search_category . '%')->orderBy($sort_name, 'desc');
                } elseif ($sorting_method == true && $sort_name != null) {
                    $list->where('category', 'LIKE', '%' . $search_category . '%')->orderBy($sort_name, 'asc');

                    $list_count->where('category', 'LIKE', '%' . $search_category . '%')->orderBy($sort_name, 'asc');
                }
            }

            if (empty($search_document_name) && empty($search_created_at) && empty($search_category)) {

                if ($sorting_method == false && $sort_name != null) {
                    $list->orderBy($sort_name, 'desc');

                    $list_count->orderBy($sort_name, 'desc');
                } elseif ($sorting_method == true && $sort_name != null) {
                    $list->orderBy($sort_name, 'asc');

                    $list_count->orderBy($sort_name, 'asc');
                }
            }

            $list = $list->get();

            $list_count = $list_count->count();

            $current_total = $list->count();

            $list = $this->arrange_data($list);
            $op_data = array('data' => $list, 'count' => $list_count);
        }


        // $list = $this->list_table_data($page_no,$page_count);
        return response()->json([
            'data' => $op_data,
            'count' => $list_count,
            'current_total' => $current_total,
            'skip' => $skip,
        ]);
    }

    public function download_doc_file(LoginRequest $request)
    {
        $doc_id = $request->get('doc_id');
        $file_name = $request->get('file_data');

        $list = Document::where('id', $doc_id)->get();

        $dec_name = json_decode($list[0]['file_name']);
        $dec_save = json_decode($list[0]['uploaded_name']);

        $position = 0;
        $file_value = null;
        // $key = array_search ($file_name, $dec_name);
        foreach ($dec_name as $key => $value) {
            if ($value == $file_name) {
                $position = $key;
                $file_value = $value;
            }
        }

        $saved_name = $dec_save[$position];

        //dd($saved_name);

        $file_path = storage_path('documents/' . $saved_name);
        $headers = [
            'Content-Type' => 'application',
        ];

        //$path=storage_path('documents/');
        //dd($saved_name);
        $disk = Storage::disk('google');
        $contents =  $disk->url($saved_name);

        // $contents->move($path,$saved_name);
        // return response()->download($file_path, $file_value, $headers);


        return response()->json(['data' => $contents]);
    }

    public function view_doc_file(LoginRequest $request)
    {
        $doc_id = $request->get('id');

        $document = Document::where('id', $doc_id)->get();

        foreach ($document as $key => $value) {
            $document_filename = json_decode($document[$key]['file_name'], true);
            $document_list = implode('', $document_filename);
            $document[$key]['file_name'] = $document_list;
        }



        return $document;
    }


    public function delete_doc_file(LoginRequest $request)
    {
        $files = $request->get('file_name');
        $doc_id = $request->get('id');

        // dd($files);

        // dd(sizeof($files));

        if (isset($files)) {
            $list = Document::where('id', $doc_id)->get();

            $dec_name = json_decode($list[0]['file_name']);
            $dec_save = json_decode($list[0]['uploaded_name']);

            if ($list[0]['archived'] != null) {
                $arch_names = json_decode($list[0]['archived']);
            } else {
                $arch_names = [];
            }
            $position = 0;
            $file_value = null;
            // $key = array_search ($file_name, $dec_name);
            foreach ($dec_name as $key => $value) {
                if ($value == $files) {
                    $position = $key;
                    $file_value = $value;
                }
            }
            $saved_name = $dec_save[$position];
            $file_path = storage_path('documents/' . $saved_name);

            File::delete($file_path);
            $disk = Storage::disk('google');
            $response =   $disk->delete($saved_name);

            array_splice($dec_name, $position, 1);
            array_splice($dec_save, $position, 1);
            array_push($arch_names, $files);


            if (sizeof($dec_name) == 0 && sizeof($dec_save) == 0) {
                $update_claim = DB::table('documents')->where('id', $doc_id)->update(array(
                    'file_name'             => null,
                    'uploaded_name'         => null,
                    'archived'              => json_encode($arch_names),
                    'deleted_at'           =>  now()
                ));
            } else {

                $update_claim = DB::table('documents')->where('id', $doc_id)->update(array(
                    'file_name'             => json_encode($dec_name),
                    'uploaded_name'         => json_encode($dec_save),
                    'archived'              => json_encode($arch_names)
                ));
            }
        } else {


            foreach ($files as $key => $file_name) {
                $list = Document::where('id', $doc_id)->get();

                $dec_name = json_decode($list[0]['file_name']);
                $dec_save = json_decode($list[0]['uploaded_name']);

                if ($list[0]['archived'] != null) {
                    $arch_names = json_decode($list[0]['archived']);
                } else {
                    $arch_names = [];
                }
                $position = 0;
                $file_value = null;
                // $key = array_search ($file_name, $dec_name);
                foreach ($dec_name as $key => $value) {
                    if ($value == $file_name) {
                        $position = $key;
                        $file_value = $value;
                    }
                }
                $saved_name = $dec_save[$position];
                $file_path = storage_path('documents/' . $saved_name);

                // File::delete($file_path);
                $disk = Storage::disk('google');
                $response =   $disk->delete($saved_name);

                array_splice($dec_name, $position, 1);
                array_splice($dec_save, $position, 1);
                array_push($arch_names, $file_name);


                if (sizeof($dec_name) == 0 && sizeof($dec_save) == 0) {
                    $update_claim = DB::table('documents')->where('id', $doc_id)->update(array(
                        'file_name'             => null,
                        'uploaded_name'         => null,
                        'archived'              => json_encode($arch_names),
                        'deleted_at'           =>  now()
                    ));
                } else {

                    $update_claim = DB::table('documents')->where('id', $doc_id)->update(array(
                        'file_name'             => json_encode($dec_name),
                        'uploaded_name'         => json_encode($dec_save),
                        'archived'              => json_encode($arch_names)
                    ));
                }
            }
        }



        // $list= Document::where('deleted_at',null)->get();
        $page_no = $request->get('page_no');
        $page_count = $request->get('page_count');
        $list = $this->list_table_data($page_no, $page_count);
        return response()->json([
            'data' => $list
        ]);
    }



    protected function arrange_data($data)
    {




        foreach ($data as $key => $value) {
            $assigned_to = User::where('id', $data[$key]['created_by'])->pluck('firstname');
            $data[$key]['created_by_name'] = $assigned_to[0];
            $data[$key]['created_at_date'] = date('d-m-Y', strtotime($data[$key]['created_at']));

            $file_nos = json_decode($data[$key]['file_name'], true);
            $data[$key]['file_nos'] = sizeof($file_nos);



            if ($data[$key]['updated_by'] != null) {
                $assigned_to = User::where('id', $data[$key]['updated_by'])->pluck('firstname');
                $data[$key]['updated_by_name'] = $assigned_to[0];
                $data[$key]['updated_at_date'] = date('d-m-Y', strtotime($data[$key]['updated_at']));
            } else {
                $data[$key]['updated_by_name'] = 'NA';
                $data[$key]['updated_at_date'] = 'NA';
            }
        }

        //  $op_data=array('data' =>$data,'count'=>$list_count);
        return $data;
    }
}
