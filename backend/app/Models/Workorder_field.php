<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Workorder_field extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'work_order_name','work_order_type','due_date','status', 'priority','work_notes','created_by', 'created_at','updated_at','deleted_at'
    ];
}
