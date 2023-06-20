<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Import_field extends Model
{
    use HasFactory;

    protected $fillable = [
        'id', 'file_upload_id', 'acct_no', 'claim_no', 'patient_name', 'dos', 'dob', 'ssn', 'gender', 'phone_no', 'address_1', 'address_2', 'city', 'state', 'zipcode', 'guarantor', 'employer',
        'responsibility', 'insurance_type', 'prim_ins_name', 'prim_pol_id', 'prim_group_id', 'prim_address_1', 'prim_address_2', 'prim_city', 'prim_state', 'prim_zipcode', 'sec_ins_name',
        'sec_pol_id', 'sec_group_id', 'sec_address_1', 'sec_address_2', 'sec_city', 'sec_state', 'sec_zipcode', 'ter_ins_name', 'ter_pol_id', 'ter_group_id', 'ter_address_1', 'ter_address_2',
        'ter_city', 'ter_state', 'ter_zipcode', 'auth_no', 'rendering_prov', 'billing_prov', 'facility', 'admit_date', 'discharge_date', 'cpt', 'icd', 'modifiers', 'units', 'total_charges', 'pat_ar',
        'ins_ar', 'total_ar', 'claim_Status', 'closed_claim_date', 'claim_note', 'assigned_to', 'status_code', 'substatus_code', 'followup_associate', 'followup_date', 'followup_work_order',
        'audit_work_order', 'ca_work_order', 'rcm_work_order', 'claim_closing', 'billed_submit_date', 'denial_code', 'reimport_status'
    ];


    public function users()
    {
        return $this->belongsTo('App\User', 'assigned_to', 'id');
    }

    public function claim_notes()
    {
        return $this->belongsTo('App\Claim_note', 'claim_no', 'claim_id');
    }

    public function process_note()
    {
        return $this->belongsTo('App\Process_note', 'claim_no', 'claim_id')->latest();
    }

    public function qc_notes()
    {
        return $this->belongsTo('App\Qc_note', 'claim_no', 'claim_id')->latest();
    }

    public function Claim_history()
    {
        return $this->belongsTo('App\Claim_history', 'claim_no', 'claim_id')->orderBy('id', 'desc');
    }
    public function Claim_history_asc()
    {
        return $this->belongsTo('App\Claim_history', 'claim_no', 'claim_id')->orderBy('id', 'asc');
    }

    public function FileName_details()
    {
        return $this->belongsTo('App\File_upload', 'file_upload_id', 'id');
    }
}
