<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ImportViewClaims implements ToCollection
{

    /**
    * @param Collection $collection
    */
    public function collection(Collection $collection)
    {

    }
}
