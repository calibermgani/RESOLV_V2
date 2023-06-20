<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ParentParameter extends Model
{
    use HasFactory;

    protected $fillable = ['err_params', 'status', 'created_by', 'updated_by'];
}
