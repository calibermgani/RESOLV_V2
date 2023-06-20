<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sub_statuscode extends Model
{
    use HasFactory;

    protected $table = 'sub_status';

    protected $fillable = [
        'status_code','parent_status_id','description','created_at','updated_at','created_by','updated_by','deleted_at','status','modules'
    ];
}
