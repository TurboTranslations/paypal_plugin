<?php

/**
 * Created by PhpStorm.
 * User: riccio
 * Date: 22/09/17
 * Time: 10.47
 */

namespace Features\Paypal\Utils ;


class Routes {

    public static function staticBuild( $file, $options=array() ) {
        $host = \Routes::pluginsBase( $options );
        return $host . "/paypal/static/build/$file" ;
    }

    public static function staticSrc( $file, $options=array() ) {
        $host = \Routes::pluginsBase( $options );
        return $host . "/paypal/static/$file" ;
    }

    public static function projectImageReferences( $projectStructure, $fileName, $options=[] ){
        $host = \Routes::pluginsBase( $options );
        return [ 'path' => $host . "/paypal/reference-files/{$projectStructure[ 'id_project' ]}/{$projectStructure[ 'ppassword' ]}/", 'file_index' => $fileName ];
    }

}