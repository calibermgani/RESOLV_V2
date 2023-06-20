<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApiRequest;
use App\Models\Customer;
use Exception;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['createVendor', 'getVendor', 'updateVendor', 'getLogs', 'viewLog']]);
    }

    public function createVendor(ApiRequest $request)
    {
        try {
            $user_id = $request->get('user_id');
            $form_data = $request->get('form');
            $form_data['created_by'] = $user_id;

            $create = Customer::create(
                $form_data
            );

            return response()->json([
                'data' => $create
            ]);
        } catch (Exception $e) {
            Log::debug("create vendor error: " . $e->getMessage());
        }
    }

    public function getVendor()
    {
        try {
            $customer = Customer::all();

            return response()->json([
                'data' => $customer
            ]);
        } catch (Exception $e) {
            Log::debug("get vendor error: " . $e->getMessage());
        }
    }

    public function updateVendor(ApiRequest $request)
    {
        try {
            $user_id = $request->get('user_id');
            $update_data = $request->get('form');
            $update_id = $request->get('upd_id');

            $update = Customer::where('id', $update_id)->update($update_data);
            $customer = Customer::all();


            return response()->json([
                'data' => $customer
            ]);
        } catch (Exception $e) {
            Log::debug("update vendor error: " . $e->getMessage());
        }
    }

    public function getLogs()
    {
        try {
            $data = [];
            $destinationPath = public_path('../storage/logs');
            // $destinationPath2=public_path('../config/edit_permission.txt');
            // $jsondec = json_decode(file_get_contents($destinationPath) , true);


            $filesInFolder = File::files($destinationPath);
            $i = 0;
            foreach ($filesInFolder as $path) {
                $name = pathinfo($path);
                $file_name = $name['filename'];
                $date = explode("laravel-", $file_name);

                $data[$i]['file_name'] = $file_name;
                $data[$i]['date'] = $date[1];
                $i++;
            }


            return response()->json([
                'data' => $data
            ]);
        } catch (Exception $e) {
            Log::debug("get log error: " . $e->getMessage());
        }
    }

    public function viewLog(ApiRequest $request)
    {
        try {
            $file_name = $request->get('file_name');
            $destinationPath = public_path('../storage/logs/' . $file_name . ".log");

            $content = file_get_contents($destinationPath);
            return response()->json([
                'data' => $content
            ]);
        } catch (Exception $e) {
            Log::debug("get log error: " . $e->getMessage());
        }
    }
}
