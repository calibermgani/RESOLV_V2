<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class User_work_profile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id','practice_id','role_id','claim_assign_limit','created_at','caller_benchmark','created_by','updated_by','updated_at'
    ];
}
