<?php

namespace App\Imports;

use App\Models\File_upload;
use App\Models\Import_field;
use App\Models\Line_item;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class ImportNewClaims implements ToCollection, WithHeadingRow
{
    public $filename;
    public $report_date;
    public $notes;
    public $user;
    public $fileNameToStore;
    public $practice_dbid;
    public $display_claims;

    public function __construct($filename, $report_date, $notes, $user, $fileNameToStore, $practice_dbid)
    {
        $this->filename = $filename;
        $this->report_date = $report_date;
        $this->notes = $notes;
        $this->user = $user;
        $this->fileNameToStore = $fileNameToStore;
        $this->practice_dbid = $practice_dbid;
    }

    /**
     * @param Collection $collection
     */
    public function collection(Collection $collections)
    {
        $display_data = [];
        $mismatch_data = [];
        $duplicate_data = [];
        $new_data = [];
        $duplicate_details = [];
        $newdata = [];

        $duplicate_filter = [];
        $new_filter = [];
        $new_filter_data = [];

        $duplicate_record = 0;
        $new_record = 0;
        $mismatch_record = 0;
        $total_records = 0;
        $mismat_monitor = [];

        $upd_line_items = [];

        $path = $this->fileNameToStore;

        $count = 1;
        $array = $collections->toArray();
        // dd($array);
        $present_data = Config::get('fields.data');
        $op_array = [];

        foreach ($present_data as $key => $value) {
            $op_array[$value] = NULL;

            if ($value == 'dos' || $value == 'dob' || $value == 'admit_date' || $value == 'discharge_date') {
                $op_array[$value] = '0000';
            }
        }

        $destinationPath = public_path('../config/test/test.txt');
        $jsondec = json_decode(file_get_contents($destinationPath), true);
        $jsonindex = array_keys($jsondec);

        /*Handle names*/
        $field_value = Config::get('fields.data');

        $field_keys = [];

        foreach ($jsonindex as $json) {
            $value = $field_value[$json];
            array_push($jsonindex, $value);
            array_push($field_keys, $json);
        }

        $name_destinationPath = public_path('../config/test/fields_name.txt');
        $name_jsondec = json_decode(file_get_contents($name_destinationPath), true);

        foreach ($name_jsondec as $key => $value) {
            $value = strtolower($value);
            $value_changeds = str_replace(" ", "_", $value);
            $value_changed = str_replace("/", "", $value_changeds);
            $name_jsondec[$key] = $value_changed;
        }
        //   $name_jsonindex = array_keys($name_jsondec);

        foreach ($array as $val) {
            $index_ip = array_keys($val);
            if ($val['claim_no'] != null) {
                /* TO Change Date format number format to date format when excel import */
                $dateFields = ['dos', 'dob', 'billedlast_submit_date', 'admit_date', 'discharge_date'];
                foreach ($dateFields as $field) {
                    if (isset($val[$field])) {
                        if (Arr::has($val, $field)) {
                            $val[$field] = Date::excelToDateTimeObject($val[$field]);
                        }
                    }
                }

                /*To Change Name from Upload DOC to work name*/
                $name_changed = [];
                $i = 1;
                // dd($name_jsondec);
                foreach ($name_jsondec as $key => $value) {
                    $index_ip = array_filter($index_ip);
                    if (in_array($value, $index_ip)) {
                        $name_changed[$key] = $val[$value];
                        $i++;
                    }
                }

                $val = $name_changed;
                $index_ip = array_keys($val);
                // dd($index_ip);
                $count_ip = count($index_ip);
                // dd($count_ip);
                $index_present = array_keys($present_data);
                // dd($index_present);

                for ($i = 0; $i < $count_ip; $i++) {
                    //print_r($index_present); echo "</br>";
                    if (in_array($index_ip[$i], $index_present)) {
                        if ($val[$index_ip[$i]] == NULL) {
                            $op_array[$present_data[$index_ip[$i]]] = NULL;
                        } else if (is_object($val[$index_ip[$i]]) == true) {
                            $op_array[$present_data[$index_ip[$i]]] = $val[$index_ip[$i]]->format('m/d/Y');
                        } else {
                            $op_array[$present_data[$index_ip[$i]]] = $val[$index_ip[$i]];
                            // print_r($op_array[$present_data[$index_ip[$i]]]);
                        }
                    }
                }
                //      $op_array['file_upload_id']=$file_upload['id'];

                // DO the Process Work HERE**********

                //dd($op_array['claim_no']);
                $check_duplicate = Import_field::where('claim_no', $op_array['claim_no'])->count();
                //dd($check_duplicate);

                if ($check_duplicate != 0) {
                    if (!in_array($op_array['claim_no'], $duplicate_filter)) {
                        $duplicate_record++;
                        $total_records++;
                        array_push($duplicate_filter, $op_array['claim_no']);
                    }
                    array_push($duplicate_data, $op_array['claim_no']);
                    $mismatch = Import_field::where('claim_no', $op_array['claim_no'])->first()->toArray();
                    $mismat_data = $mismatch;

                    $tableFieldArr = [];
                    //dd($mismat_data);
                    foreach ($mismat_data as $key => $value) {
                        // 'total_charges' => $value['total_charges'],
                        if ($key == 'total_charges') {
                            if (!empty($value)) {
                                $tableFieldArr['total_charges'] = trim(number_format((float)$value, 2, '.', ''));
                                // $tableFieldArr['total_charges'] = trim($value);
                            }
                        } else if ($key == 'pat_ar') {
                            if (!empty($value)) {
                                $tableFieldArr['pat_ar'] = trim(number_format((float)$value, 2, '.', ''));
                            }
                        } else if ($key == 'ins_ar') {
                            if (!empty($value)) {
                                $tableFieldArr['ins_ar'] = trim(number_format((float)$value, 2, '.', ''));
                            }
                        } else if ($key == 'total_ar') {
                            if (!empty($value)) {
                                $tableFieldArr['total_ar'] = trim(number_format((float)$value, 2, '.', ''));
                            }
                        } else if ($key == 'address_1') {
                            $tableFieldArr['address_line_1'] = trim($value);
                        } else if ($key == 'address_2') {
                            $tableFieldArr['address_line_2'] = trim($value);
                        } else if ($key == 'prim_ins_name') {
                            $tableFieldArr['primary_insurance_name'] = trim($value);
                            //print_r($tableFieldArr['primary_insurance_name']);
                        } else if ($key == 'prim_pol_id') {
                            $tableFieldArr['primary_policy_id'] = trim($value);
                        } else if ($key == 'prim_group_id') {
                            $tableFieldArr['primary_group_id'] = trim($value);
                        } else if ($key == 'prim_address_1') {
                            $tableFieldArr['primary_insurance_address_line_1'] = trim($value);
                        } else if ($key == 'prim_address_2') {
                            $tableFieldArr['primary_insurance_address_line_2'] = trim($value);
                        } else if ($key == 'prim_city') {
                            $tableFieldArr['primary_insurance_city'] = trim($value);
                        } else if ($key == 'prim_state') {
                            $tableFieldArr['primary_insurance_state'] = trim($value);
                        } else if ($key == 'prim_zipcode') {
                            $tableFieldArr['primary_insurance_zipcode'] = trim($value);
                        } else if ($key == 'sec_ins_name') {
                            $tableFieldArr['secondary_insurance_name'] = trim($value);
                        } else if ($key == 'sec_pol_id') {
                            $tableFieldArr['secondary_policy_id'] = trim($value);
                        } else if ($key == 'sec_group_id') {
                            $tableFieldArr['secondary_group_id'] = trim($value);
                        } else if ($key == 'sec_address_1') {
                            $tableFieldArr['secondary_insurance_address_line_1'] = trim($value);
                        } else if ($key == 'sec_address_2') {
                            $tableFieldArr['secondary_insurance_address_line_2'] = trim($value);
                        } else if ($key == 'sec_city') {
                            $tableFieldArr['secondary_insurance_city'] = trim($value);
                        } else if ($key == 'sec_state') {
                            $tableFieldArr['secondary_insurance_state'] = trim($value);
                        } else if ($key == 'sec_zipcode') {
                            $tableFieldArr['secondary_insurance_zipcode'] = trim($value);
                        } else if ($key == 'ter_ins_name') {
                            $tableFieldArr['tertiary_insurance_name'] = trim($value);
                        } else if ($key == 'ter_pol_id') {
                            $tableFieldArr['tertiary_policy_id'] = trim($value);
                        } else if ($key == 'ter_group_id') {
                            $tableFieldArr['tertiary_group_id'] = trim($value);
                        } else if ($key == 'ter_address_1') {
                            $tableFieldArr['tertiary_insurance_address_line_1'] = trim($value);
                        } else if ($key == 'ter_address_2') {
                            $tableFieldArr['tertiary_insurance_address_line_2'] = trim($value);
                        } else if ($key == 'ter_city') {
                            $tableFieldArr['tertiary_insurance_city'] = trim($value);
                        } else if ($key == 'ter_state') {
                            $tableFieldArr['tertiary_insurance_state'] = trim($value);
                        } else if ($key == 'ter_zipcode') {
                            $tableFieldArr['tertiary_insurance_zipcode'] = trim($value);
                        } else if ($key == 'auth_no') {
                            $tableFieldArr['authorization'] = trim($value);
                        } else if ($key == 'rendering_prov') {
                            $tableFieldArr['rendering_provider'] = trim($value);
                        } else if ($key == 'billing_prov') {
                            $tableFieldArr['billing_provider'] = trim($value);
                        } else if ($key == 'claim_note') {
                            $tableFieldArr['claim_note'] = trim($value);
                        } else if ($key == 'denial_code') {
                            $tableFieldArr['denial_code'] = trim($value);
                        } else
                            $tableFieldArr[$key] = trim($value);
                    }

                    foreach ($op_array as $key => $value) {
                        Log::info($key . '------' . $value);
                        if ($key == 'acct_no') {
                            if (!empty($op_array['acct_no'])) {
                                $op_array['acct_no'] = trim($value);
                            }
                        }
                        if ($key == 'claim_no') {
                            if (!empty($op_array['claim_no'])) {
                                $op_array['claim_no'] = trim($value);
                            }
                        }
                        if ($key == 'patient_name') {
                            if (!empty($op_array['patient_name'])) {
                                $op_array['patient_name'] = trim($value);
                            }
                        }
                        if ($key == 'gender') {
                            if (!empty($op_array['gender'])) {
                                $op_array['gender'] = trim($value);
                            }
                        }
                        if ($key == 'address_line_1') {
                            if (!empty($op_array['address_line_1'])) {
                                $op_array['address_line_1'] = trim($value);
                            }
                        }
                        if ($key == 'address_line_2') {
                            if (!empty($op_array['address_line_2'])) {
                                $op_array['address_line_2'] = trim($value);
                            }
                        }
                        if ($key == 'city') {
                            if (!empty($op_array['city'])) {
                                $op_array['city'] = trim($value);
                            }
                        }
                        if ($key == 'state') {
                            if (!empty($op_array['state'])) {
                                $op_array['state'] = trim($value);
                            }
                        }
                        if ($key == 'zipcode') {
                            if (!empty($op_array['zipcode'])) {
                                $op_array['zipcode'] = trim($value);
                            }
                        }
                        if ($key == 'guarantor') {
                            if (!empty($op_array['guarantor'])) {
                                $op_array['guarantor'] = trim($value);
                            }
                        }
                        if ($key == 'employer') {
                            if (!empty($op_array['employer'])) {
                                $op_array['employer'] = trim($value);
                            }
                        }
                        if ($key == 'responsibility') {
                            if (!empty($op_array['responsibility'])) {
                                $op_array['responsibility'] = trim($value);
                            }
                        }
                        if ($key == 'insurance_type') {
                            if (!empty($op_array['insurance_type'])) {
                                $op_array['insurance_type'] = trim($value);
                            }
                        }
                        if ($key == 'primary_insurance_name') {
                            if (!empty($op_array['primary_insurance_name'])) {
                                $op_array['primary_insurance_name'] = trim($value);
                            }
                        }
                        if ($key == 'primary_policy_id') {
                            if (!empty($op_array['primary_policy_id'])) {
                                $op_array['primary_policy_id'] = trim($value);
                            }
                        }
                        if ($key == 'primary_group_id') {
                            if (!empty($op_array['primary_group_id'])) {
                                $op_array['primary_group_id'] = trim($value);
                            }
                        }
                        if ($key == 'primary_insurance_address_line_1') {
                            if (!empty($op_array['primary_insurance_address_line_1'])) {
                                $op_array['primary_insurance_address_line_1'] = trim($value);
                            }
                        }
                        if ($key == 'primary_insurance_address_line_2') {
                            if (!empty($op_array['primary_insurance_address_line_2'])) {
                                $op_array['primary_insurance_address_line_2'] = trim($value);
                            }
                        }
                        if ($key == 'primary_insurance_city') {
                            if (!empty($op_array['primary_insurance_city'])) {
                                $op_array['primary_insurance_city'] = trim($value);
                            }
                        }
                        if ($key == 'primary_insurance_state') {
                            if (!empty($op_array['primary_insurance_state'])) {
                                $op_array['primary_insurance_state'] = trim($value);
                            }
                        }
                        if ($key == 'primary_insurance_zipcode') {
                            if (!empty($op_array['primary_insurance_zipcode'])) {
                                $op_array['primary_insurance_zipcode'] = trim($value);
                            }
                        }
                        if ($key == 'secondary_insurance_name') {
                            if (!empty($op_array['secondary_insurance_name'])) {
                                $op_array['secondary_insurance_name'] = trim($value);
                            }
                        }
                        if ($key == 'secondary_policy_id') {
                            if (!empty($op_array['secondary_policy_id'])) {
                                $op_array['secondary_policy_id'] = trim($value);
                            }
                        }
                        if ($key == 'secondary_group_id') {
                            if (!empty($op_array['secondary_group_id'])) {
                                $op_array['secondary_group_id'] = trim($value);
                            }
                        }
                        if ($key == 'secondary_insurance_address_line_1') {
                            if (!empty($op_array['secondary_insurance_address_line_1'])) {
                                $op_array['secondary_insurance_address_line_1'] = trim($value);
                            }
                        }
                        if ($key == 'secondary_insurance_address_line_2') {
                            if (!empty($op_array['secondary_insurance_address_line_2'])) {
                                $op_array['secondary_insurance_address_line_2'] = trim($value);
                            }
                        }
                        if ($key == 'secondary_insurance_city') {
                            if (!empty($op_array['secondary_insurance_city'])) {
                                $op_array['secondary_insurance_city'] = trim($value);
                            }
                        }
                        if ($key == 'secondary_insurance_state') {
                            if (!empty($op_array['secondary_insurance_state'])) {
                                $op_array['secondary_insurance_state'] = trim($value);
                            }
                        }
                        if ($key == 'secondary_insurance_zipcode') {
                            if (!empty($op_array['secondary_insurance_zipcode'])) {
                                $op_array['secondary_insurance_zipcode'] = trim($value);
                            }
                        }
                        if ($key == 'tertiary_insurance_name') {
                            if (!empty($op_array['tertiary_insurance_name'])) {
                                $op_array['tertiary_insurance_name'] = trim($value);
                            }
                        }
                        if ($key == 'tertiary_policy_id') {
                            if (!empty($op_array['tertiary_policy_id'])) {
                                $op_array['tertiary_policy_id'] = trim($value);
                            }
                        }
                        if ($key == 'tertiary_group_id') {
                            if (!empty($op_array['tertiary_group_id'])) {
                                $op_array['tertiary_group_id'] = trim($value);
                            }
                        }
                        if ($key == 'tertiary_insurance_address_line_1') {
                            if (!empty($op_array['tertiary_insurance_address_line_1'])) {
                                $op_array['tertiary_insurance_address_line_1'] = trim($value);
                            }
                        }
                        if ($key == 'tertiary_insurance_address_line_2') {
                            if (!empty($op_array['tertiary_insurance_address_line_2'])) {
                                $op_array['tertiary_insurance_address_line_2'] = trim($value);
                            }
                        }
                        if ($key == 'tertiary_insurance_city') {
                            if (!empty($op_array['tertiary_insurance_city'])) {
                                $op_array['tertiary_insurance_city'] = trim($value);
                            }
                        }
                        if ($key == 'tertiary_insurance_state') {
                            if (!empty($op_array['tertiary_insurance_state'])) {
                                $op_array['tertiary_insurance_state'] = trim($value);
                            }
                        }
                        if ($key == 'tertiary_insurance_zipcode') {
                            if (!empty($op_array['tertiary_insurance_zipcode'])) {
                                $op_array['tertiary_insurance_zipcode'] = trim($value);
                            }
                        }
                        if ($key == 'authorization') {
                            if (!empty($op_array['authorization'])) {
                                $op_array['authorization'] = trim($value);
                            }
                        }
                        if ($key == 'rendering_provider') {
                            if (!empty($op_array['rendering_provider'])) {
                                $op_array['rendering_provider'] = trim($value);
                            }
                        }
                        if ($key == 'billing_provider') {
                            if (!empty($op_array['billing_provider'])) {
                                $op_array['billing_provider'] = trim($value);
                            }
                        }
                        if ($key == 'facility') {
                            if (!empty($op_array['facility'])) {
                                $op_array['facility'] = trim($value);
                            }
                        }
                        if ($key == 'modifiers') {
                            if (!empty($op_array['modifiers'])) {
                                $op_array['modifiers'] = trim($value);
                            }
                        }
                        if ($key == 'units') {
                            if (!empty($op_array['units'])) {
                                $op_array['units'] = trim($value);
                            }
                        }
                        if ($key == 'icd') {
                            if (!empty($op_array['icd'])) {
                                $op_array['icd'] = trim($value);
                            }
                        }
                        if ($key == 'claim_Status') {
                            if (!empty($op_array['claim_Status'])) {
                                $op_array['claim_Status'] = trim($value);
                            }
                        }
                        if ($key == 'claim_note') {
                            if (!empty($op_array['claim_note'])) {
                                $op_array['claim_note'] = trim($value);
                            }
                        }
                        if ($key == 'dos') {
                            if ($op_array['dos'] == 0) {
                                $op_array['dos'] = '';
                            } else {
                                $values = trim($value);
                                $op_array['dos'] = date('Y-m-d', strtotime($values));
                            }
                        }
                        if ($key == 'dob') {
                            if ($op_array['dob'] == 0) {
                                $op_array['dob'] = '';
                            } else {
                                $values = trim($value);
                                $op_array['dob'] = date('Y-m-d', strtotime($values));
                            }
                        }
                        if ($key == 'admit_date') {
                            if ($op_array['admit_date'] == 0) {
                                $op_array['admit_date'] = '';
                            } else {
                                $values = trim($value);
                                $op_array['admit_date'] = date('Y-m-d', strtotime($values));
                            }
                        }
                        if ($key == 'discharge_date') {
                            if ($op_array['discharge_date'] == 0) {
                                $op_array['discharge_date'] = '';
                            } else {
                                $values = trim($value);
                                $op_array['discharge_date'] = date('Y-m-d', strtotime($values));
                            }
                        }
                        if ($key == 'pat_ar') {
                            if (!empty($value)) {
                                $values = trim(number_format((float)$value, 2, '.', ''));
                                $op_array['pat_ar'] = $values;
                            }
                        }
                        if ($key == 'total_charges') {
                            if (!empty($value)) {
                                $values = trim($value);
                                $op_array['total_charges'] = number_format((float)$values, 2, '.', '');
                            }
                        }
                        if ($key == 'ins_ar') {
                            if (!empty($value)) {
                                $values = trim($value);
                                $op_array['ins_ar'] = number_format((float)$values, 2, '.', '');
                            }
                        }
                        if ($key == 'total_ar') {
                            if (!empty($value)) {
                                $values = trim($value);
                                $op_array['total_ar'] = number_format((float)$values, 2, '.', '');
                            }
                        }
                        if ($key == 'billedlast_submit_date') {
                            if ($op_array['billedlast_submit_date'] == 0) {
                                $op_array['billedlast_submit_date'] = '';
                            } else {
                                $values = trim($value);
                                $op_array['billedlast_submit_date'] = date('Y-m-d', strtotime($values));
                            }
                        }

                        if ($key == 'denial_code') {
                            if (!empty($op_array['denial_code'])) {
                                $op_array['denial_code'] = trim($value);
                            }
                        }
                    }
                    $difference = array_diff($op_array, $mismatch);
                    //dd($difference);
                    $key_diff = array_keys($difference);
                    // dd($key_diff);
                    //   $display_data['test_data']=$op_array;
                    //   $display_data['test_data1']=$difference;
                    //   $display_data['test_data2']=$key_diff;

                    //Mismatched Claims must be Differentiated Here
                    $mismatch = 0;

                    /*Exceptions       */
                    $exception = ['total_ar_due', 'ins_ar', 'units', 'modifier', 'icd', 'cpt', 'dos', 'billedlast_submit_date'];
                    foreach ($key_diff as $diff) {
                        if (in_array($diff, $jsonindex)) {
                            // array_push($jsonindex,$value);
                            // array_push($field_keys,$json);

                            $key = array_search($diff, $field_keys);
                            $diff_pass = $jsonindex[$key];

                            if ($jsondec[$diff_pass][1] == 'notify') {

                                /* Due to Line Items */
                                if (!in_array($diff, $exception)) {
                                    $mismatch++;
                                    $mismatch_data[$op_array['claim_no']]['midb'][$diff] = $tableFieldArr[$diff];
                                    $mismatch_data[$op_array['claim_no']]['mupd'][$diff] = $op_array[$diff];
                                    //dd($mismatch_data[$op_array['claim_no']]['mupd'][$diff]);
                                }
                            }
                        }
                    }
                    if ($mismatch > 0 && !in_array($op_array['claim_no'], $mismat_monitor)) {
                        // dd($mismat_monitor);
                        // dd($op_array['claim_no']);
                        $mismatch_record++;
                        // dd($mismatch_record++);
                        array_push($mismat_monitor, $op_array['claim_no']);

                        //dd($mismat_monitor);
                    }

                    $display_data['mismatch_data'] = $mismatch_data;
                    // print_r($display_data['mismatch_data']);
                    $display_data['duplicate_data'] = $duplicate_data;
                    $display_data['duplicate_filter'] = $duplicate_filter;


                    /*Update Line Items Part - 1*/

                    $upd_monitor = [];
                    array_push($upd_line_items, $op_array);

                    if (!in_array($op_array['claim_no'], $upd_monitor)) {
                        //dd($op_array['claim_no']);
                        array_push($upd_monitor, $op_array['claim_no']);
                        DB::table('line_items')->where('claim_id', $op_array['claim_no'])->delete();
                    }
                    //Update Line Items EOP - 1
                } else {

                    if (!in_array($op_array['claim_no'], $new_filter)) {
                        $total_records++;
                        $new_record++;
                        array_push($new_filter, $op_array['claim_no']);
                        array_push($new_filter_data, $op_array);
                    }

                    array_push($new_data, $op_array['claim_no']);
                    array_push($newdata, $op_array);
                    // $newdata[$op_array['claim_no']]=$op_array;
                    $display_data['mismatch_data'] = [];
                    $display_data['duplicate_data'] = [];
                    $display_data['duplicate_filter'] = [];
                }
                $display_data['new_data'] =  $new_data;
                $display_data['new_datas'] =  $newdata;
                $display_data['new_filter'] = $new_filter;
                $display_data['new_filter_data'] = $new_filter_data;
                $display_data['mismatch_nos'] = $mismatch_record;
            }
        }

        /*Line items Update Code contd...*/

        if (sizeof($upd_line_items) != 0) {
            foreach ($upd_line_items as $update) {
                $import_line = Line_item::create(
                    array(
                        'claim_id'          => $update['claim_no'],
                        'total_ar_due'      => $update['total_ar'],
                        'ins_ar'            => $update['ins_ar'],
                        'pat_ar'            => $update['pat_ar'],
                        'units'             => $update['units'],
                        'modifier'          => $update['modifiers'],
                        'icd'               => $update['icd'],
                        'cpt'               => $update['cpt'],
                        'dos'               => $update['dos']
                    )
                );
            }
        }
        $field_name = [
            "acct_no" => "Account Number",
            "claim_no" => "Claim Number",
            "patient_name" => "Patient Name",
            "dos" => "DOS",
            "dob" => "DOB",
            "ssn" => "SSN",
            "gender" => "Gender",
            "phone_no" => "Phone Number",
            "address_line_1" => "Address 1",
            "address_line_2" => "Address 2",
            "city" => "City",
            "state" => "State",
            "zipcode" => "Zip Code",
            "guarantor" => "Guarantor",
            "employer" => "Employer",
            "responsibility" => "Responsibility",
            "insurance_type" => "Insurance Type",
            "primary_insurance_name" => "Primary Insurance Name",
            "primary_policy_id" => "Primary Policy ID",
            "primary_group_id" => "Primary Group ID",
            "primary_insurance_address_line_1" => "Primary Address 1",
            "primary_insurance_address_line_2" => "Primary Address 2",
            "primary_insurance_city" => "Primary City",
            "primary_insurance_state" => "Primary State",
            "primary_insurance_zipcode" => "Primary Zip Code",
            "secondary_insurance_name" => "Secondary Insurance Name",
            "secondary_policy_id" => "Secondary Policy ID",
            "secondary_group_id" => "Secondary Group ID",
            "secondary_insurance_address_line_1" => "Secondary Address 1",
            "secondary_insurance_address_line_2" => "Secondary Address 2",
            "secondary_insurance_city" => "Secondary City",
            "secondary_insurance_state" => "Secondary State",
            "secondary_insurance_zipcode" => "Secondary Zip Code",
            "tertiary_insurance_name" => "Tertiary Insurance Name",
            "tertiary_policy_id" => "Tertiary Policy ID",
            "tertiary_group_id" => "Tertiary Group ID",
            "tertiary_insurance_address_line_1" => "Tertiary Address 1",
            "tertiary_insurance_address_line_2" => "Tertiary Address 2",
            "tertiary_insurance_city" => "Tertiary City",
            "tertiary_insurance_state" => "Tertiary State",
            "tertiary_insurance_zipcode" => "Tertiary Zip Code",
            "authorization" => "Authentication Number",
            "rendering_provider" => "Rendering Provider",
            "billing_provider" => "Billing Provider",
            "facility" => "Facility",
            "admit_date" => "Admit Date",
            "discharge_date" => "Discharge Date",
            "cpt" => "CPT",
            "icd" => "ICD",
            "modifiers" => "Modifiers",
            "units" => "Units",
            "total_charges" => "Total Charges",
            "pat_ar" => "Patient AR",
            "ins_ar" => "Insurance AR",
            "total_ar" => "Total AR",
            "claim_Status" => "Claim Status",
            "claim_note" => "Claim Note",
            "billedlast_submit_date" => "Billed/Last Submit Date",
            "denial_code" => "Denial Code"

        ];

        $display_data['field_name'] = $field_name;

        // $display_data['Test']=$upd_line_items;

        //Insert code for 'file_uploads' Table

        $upload_check = File_upload::where('file_name', $this->filename)->first();

        //Check Values
        if ($this->report_date != NULL) {
            $date = $this->report_date;
            $date = date('Y-m-d h:i:s', strtotime($date));

            $file_upload = File_upload::create(
                [
                    'report_date'         => $date, //
                    'file_name'           => $this->filename,
                    'unique_name'         => $this->fileNameToStore,
                    'file_url'            => $path,
                    'notes'               => $this->notes,
                    'total_claims'        => $total_records,
                    'new_claims'          => $new_record,
                    'Import_by'           => $this->user,
                    'claims_processed'    => '0',
                    'status'              => 'Incomplete'
                ]
            );
            $display_data['filedata'] = $file_upload;
        } else {
            $display_data['filedata'] = $upload_check;
        }

        $uploaded_by = User::where('id', $display_data['filedata']['Import_by'])->pluck('firstname');

        $display_data['filedata']['uploaded'] = $uploaded_by[0];

        $this->display_claims = $display_data;
    }
}
