#ifndef _COMMON_
#define _COMMON_

// STD
#include <iostream>
#include <fstream>
#include <string>

// OpenMesh & Dense
#include <OpenMesh\Core\IO\MeshIO.hh>
#include <OpenMesh/Core/IO/Options.hh>
#include <OpenMesh\Core\Mesh\TriMesh_ArrayKernelT.hh>
#include <Dense>
#include <Eigenvalues>

// Name space
using namespace Eigen;
using namespace std;
using namespace OpenMesh;

// Typedef
typedef TriMesh_ArrayKernelT<>  Mesh;


#endif