const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateLegacyQuestions() {
  try {
    console.log('🔄 Starting migration of legacy questions...');

    // Tìm tất cả passages có questions với group_id bắt đầu bằng 'legacy-group-'
    const passagesWithLegacyQuestions = await prisma.ielts_reading_passages.findMany({
      where: {
        questions: {
          some: {
            group_id: {
              startsWith: 'legacy-group-'
            }
          }
        }
      },
      include: {
        questions: {
          where: {
            group_id: {
              startsWith: 'legacy-group-'
            }
          }
        }
      }
    });

    console.log(`Found ${passagesWithLegacyQuestions.length} passages with legacy questions`);

    for (const passage of passagesWithLegacyQuestions) {
      console.log(`\n📖 Processing passage: ${passage.title} (ID: ${passage.id})`);
      
      try {
        // Kiểm tra xem passage đã có groups mới chưa
        const existingGroups = await prisma.ielts_reading_question_groups.findMany({
          where: { 
            passage_id: passage.id,
            NOT: {
              id: {
                startsWith: 'legacy-group-'
              }
            }
          }
        });

        if (existingGroups.length > 0) {
          console.log(`  ⚠️  Passage already has ${existingGroups.length} new groups, skipping...`);
          continue;
        }

        // Tạo group mới cho questions hiện có
        const newGroup = await prisma.ielts_reading_question_groups.create({
          data: {
            instructions: 'Migrated questions from previous system',
            question_type: 'multiple_choice',
            display_order: 1,
            passage_id: passage.id
          }
        });

        console.log(`  ✅ Created new group: ${newGroup.id}`);

        // Cập nhật tất cả questions của passage này để thuộc về group mới
        const updateResult = await prisma.ielts_reading_questions.updateMany({
          where: { 
            group_id: {
              startsWith: 'legacy-group-'
            }
          },
          data: {
            group_id: newGroup.id
          }
        });

        console.log(`  ✅ Updated ${updateResult.count} questions to new group`);

        // Xóa legacy groups cũ
        const deleteResult = await prisma.ielts_reading_question_groups.deleteMany({
          where: {
            id: {
              startsWith: 'legacy-group-'
            }
          }
        });

        console.log(`  ✅ Deleted ${deleteResult.count} legacy groups`);

      } catch (error) {
        console.error(`  ❌ Error processing passage ${passage.id}:`, error.message);
      }
    }

    // Kiểm tra kết quả
    console.log('\n📊 Migration Summary:');
    
    const totalPassages = await prisma.ielts_reading_passages.count();
    const passagesWithGroups = await prisma.ielts_reading_passages.count({
      where: {
        question_groups: {
          some: {}
        }
      }
    });

    const totalGroups = await prisma.ielts_reading_question_groups.count();
    const totalQuestions = await prisma.ielts_reading_questions.count();

    console.log(`  Total passages: ${totalPassages}`);
    console.log(`  Passages with groups: ${passagesWithGroups}`);
    console.log(`  Total question groups: ${totalGroups}`);
    console.log(`  Total questions: ${totalQuestions}`);

    // Kiểm tra passages không có groups
    const passagesWithoutGroups = await prisma.ielts_reading_passages.findMany({
      where: {
        question_groups: {
          none: {}
        }
      }
    });

    if (passagesWithoutGroups.length > 0) {
      console.log(`\n⚠️  Found ${passagesWithoutGroups.length} passages without groups:`);
      for (const passage of passagesWithoutGroups) {
        console.log(`    - ${passage.title} (ID: ${passage.id})`);
      }
    } else {
      console.log('\n✅ All passages have been migrated successfully!');
    }

    console.log('\n🎉 Migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateLegacyQuestions(); 