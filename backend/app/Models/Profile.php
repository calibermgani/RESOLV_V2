<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    use HasFactory;

    protected $connection = 'mysql2';

    protected $table = 'profiles';

    protected $fillable = [
        'user_id', 'employee_code', 'dob', 'gender', 'mobile_phone', 'work_phone', 'address_flag_id', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
    ];
}
