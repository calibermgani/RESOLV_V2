<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Role extends Model
{
    use SoftDeletes;

     protected $connection = 'mysql2';
    protected $table = "roles";
    protected $fillable = [
        'role_name','status','created_by'
    ];
}
