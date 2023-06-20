<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient_detail extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'id','acct_no','claim_id', 'patient_name','dob','ssn', 'gender','phone_no','address_line_1','address_line_2','city','state','zipcode', 'gurantor_name','employer_name','created_at','updated_at','created_by','updated_by','deleted_at'
    ];

}
