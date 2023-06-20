<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Statuscode extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'status';

    protected $fillable = [
        'status_code','description','status','created_at','updated_at','created_by','updated_by','deleted_at','modules'
    ];
}
