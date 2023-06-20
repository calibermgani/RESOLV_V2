<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Practice extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $connection = 'mysql2';
    protected $fillable = [
        'id','practice_name','practice_description', 'email','phone','fax', 'avatar_name','practice_link','doing_business_as','speciality_id','taxanomy_id','billing_entity','entity_type', 'tax_id','group_tax_id','npi', 'group_npi','medicare_ptan','medicaid','mail_add_1','mail_add_2','mail_city','mail_state','mail_zip5','mail_zip4','primary_add_1','primary_add_2','primary_city','primary_state','primary_zip5', 'primary_zip4','practice_db_id','status', 'created_at','updated_at','created_by','updated_by','deleted_at'
    ];
}
