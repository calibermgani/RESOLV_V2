<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Imports\ImportClaims;
use App\Imports\ImportNewClaims;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class ImportClaimsController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['upload']]);
    }

    public function upload(LoginRequest $request) {
        try
        {
            $practice_dbid = $request->get('practice_dbid');
            $savedata = $request->file('file_name');
            $filenames = $savedata->getClientOriginalName();
            $user = $request->get('user_id');
            $unique_name = md5($filenames . time());
            $modify_filename = date('Y-m-d') . '_' . $filenames;
            $path = "../uploads";

            $filename = pathinfo($filenames, PATHINFO_FILENAME);
            $extension = $savedata->getClientOriginalExtension();
            // Filename to store
            $fileNameToStore = $filename.'_'.time().'.'.$extension;

            $savedata->storeAs('public/uploads/', $fileNameToStore);
            // $filePath = Storage::disk('public')->put('uploads', $fileName);
            // $path = $savedata->storeAs('uploads', $unique_name);
            // $savedata->move($path, $unique_name);
            $path = "../uploads/" . $unique_name;
            $report_date = $request->get('report_date');
            $notes = $request->get('notes');

            $importClaims = new ImportNewClaims($modify_filename, $report_date, $notes, $user, $fileNameToStore, $practice_dbid);

            $importData = Excel::import($importClaims, $request->file('file_name')->store('files'));

            return response()->json([
            'message' =>  $importClaims,
            'upload_msg'  => "Upload Complete"
        ]);
        } catch (Exception $e) {
            Log::debug($e->getMessage() . $e->getLine());
            throw new Exception($e->getMessage() . $e->getLine());
        }

    }
}
