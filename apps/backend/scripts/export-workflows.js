const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function exportWorkflows(tenantId = null, outputPath = null) {
  try {
    console.log('Starting workflow export...')

    // Build query
    const where = tenantId ? { tenantId } : {}
    
    const workflows = await prisma.workflow.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (workflows.length === 0) {
      console.log('No workflows found to export.')
      return
    }

    // Prepare export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalWorkflows: workflows.length,
      workflows: workflows.map((workflow) => ({
        id: workflow.id,
        tenantId: workflow.tenantId,
        tenantName: workflow.tenant.name,
        tenantEmail: workflow.tenant.email,
        name: workflow.name,
        description: workflow.description,
        nodes: workflow.nodes,
        edges: workflow.edges,
        isActive: workflow.isActive,
        createdAt: workflow.createdAt.toISOString(),
        updatedAt: workflow.updatedAt.toISOString(),
      })),
    }

    // Determine output path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = tenantId
      ? `workflows-tenant-${tenantId}-${timestamp}.json`
      : `workflows-all-${timestamp}.json`
    
    const finalOutputPath = outputPath || path.join(__dirname, '..', 'exports', filename)

    // Create exports directory if it doesn't exist
    const exportsDir = path.dirname(finalOutputPath)
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true })
    }

    // Write to file
    fs.writeFileSync(finalOutputPath, JSON.stringify(exportData, null, 2), 'utf8')

    console.log(`✅ Successfully exported ${workflows.length} workflow(s)`)
    console.log(`📁 Output file: ${finalOutputPath}`)
    
    // Print summary
    console.log('\n📊 Summary:')
    workflows.forEach((workflow) => {
      console.log(`  - ${workflow.name} (${workflow.tenant.name}) - ${workflow.isActive ? 'Active' : 'Inactive'}`)
    })

    return finalOutputPath
  } catch (error) {
    console.error('❌ Error exporting workflows:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const tenantIdArg = args.find((arg) => arg.startsWith('--tenant='))?.split('=')[1]
const outputArg = args.find((arg) => arg.startsWith('--output='))?.split('=')[1]

const tenantId = tenantIdArg || null
const outputPath = outputArg || null

// Run export
exportWorkflows(tenantId, outputPath)
  .then(() => {
    console.log('\n✅ Export completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Export failed:', error)
    process.exit(1)
  })
