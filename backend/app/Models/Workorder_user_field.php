<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Workorder_user_field extends Model
{
    use HasFactory;

    protected $fillable = [
        'work_order_id','user_id','cliam_no', 'completed_claim','created_at','updated_at','deleted_at'
    ];
}
